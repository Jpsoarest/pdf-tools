import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel


ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "137494"
TOKEN_TTL_SECONDS = 12 * 60 * 60
USERS_FILE = Path(os.getenv("AUTH_USERS_FILE", "data/users.json"))
PBKDF2_ITERATIONS = 210_000

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class CreateUserRequest(BaseModel):
    username: str
    password: str


class AuthUser(BaseModel):
    name: str
    role: Literal["admin", "user"]
    loginAt: str
    token: str


def _normalize_username(value: str) -> str:
    normalized = " ".join(value.strip().split())
    if len(normalized) < 2:
        raise HTTPException(status_code=400, detail="Usuario deve ter pelo menos 2 caracteres")
    return normalized


def _user_key(username: str) -> str:
    return _normalize_username(username).lower()


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _hash_password(password: str) -> str:
    if len(password) < 4:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 4 caracteres")
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${_b64url_encode(salt)}${_b64url_encode(digest)}"


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations_text, salt_text, digest_text = password_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_text)
        salt = _b64url_decode(salt_text)
        expected = _b64url_decode(digest_text)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(digest, expected)
    except Exception:
        return False


def _empty_store() -> dict:
    return {"secret": secrets.token_hex(32), "users": {}}


def _read_store() -> dict:
    if not USERS_FILE.exists():
        store = _empty_store()
        store["users"][ADMIN_USERNAME] = {
            "name": ADMIN_USERNAME,
            "role": "admin",
            "passwordHash": _hash_password(DEFAULT_ADMIN_PASSWORD),
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        _write_store(store)
        return store

    try:
        store = json.loads(USERS_FILE.read_text(encoding="utf-8"))
    except Exception:
        raise HTTPException(status_code=500, detail="Arquivo de usuarios invalido")

    changed = False
    if "secret" not in store:
        store["secret"] = secrets.token_hex(32)
        changed = True
    if "users" not in store or not isinstance(store["users"], dict):
        store["users"] = {}
        changed = True
    if ADMIN_USERNAME not in store["users"]:
        store["users"][ADMIN_USERNAME] = {
            "name": ADMIN_USERNAME,
            "role": "admin",
            "passwordHash": _hash_password(DEFAULT_ADMIN_PASSWORD),
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        changed = True
    if changed:
        _write_store(store)
    return store


def _write_store(store: dict) -> None:
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = USERS_FILE.with_suffix(".tmp")
    tmp_path.write_text(json.dumps(store, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp_path.replace(USERS_FILE)


def _make_token(username: str, role: str, secret: str) -> str:
    payload = {
        "sub": username,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    payload_text = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    payload_part = _b64url_encode(payload_text.encode("utf-8"))
    signature = hmac.new(secret.encode("utf-8"), payload_part.encode("ascii"), hashlib.sha256).digest()
    return f"{payload_part}.{_b64url_encode(signature)}"


def _read_token(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload_part, signature_part = token.split(".", 1)
    except ValueError:
        raise HTTPException(status_code=401, detail="Token invalido")

    store = _read_store()
    expected_signature = hmac.new(
        store["secret"].encode("utf-8"),
        payload_part.encode("ascii"),
        hashlib.sha256,
    ).digest()
    try:
        received_signature = _b64url_decode(signature_part)
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalido")

    if not hmac.compare_digest(received_signature, expected_signature):
        raise HTTPException(status_code=401, detail="Token invalido")

    try:
        payload = json.loads(_b64url_decode(payload_part).decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalido")

    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=401, detail="Sessao expirada")
    if _user_key(str(payload.get("sub", ""))) not in store["users"]:
        raise HTTPException(status_code=401, detail="Usuario nao existe")
    return payload


def _require_admin(authorization: str | None) -> dict:
    payload = _read_token(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Apenas admin pode executar esta acao")
    return payload


def _public_user(user: dict) -> dict:
    return {
        "name": user["name"],
        "role": user["role"],
        "createdAt": user.get("createdAt", ""),
    }


@router.post("/login", response_model=AuthUser)
def login(payload: LoginRequest):
    store = _read_store()
    key = _user_key(payload.username)
    user = store["users"].get(key)
    if not user or not _verify_password(payload.password, user.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="Usuario ou senha invalidos")

    return {
        "name": user["name"],
        "role": user["role"],
        "loginAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "token": _make_token(user["name"], user["role"], store["secret"]),
    }


@router.get("/me")
def me(authorization: str | None = Header(default=None)):
    payload = _read_token(authorization)
    return {"name": payload["sub"], "role": payload["role"]}


@router.get("/users")
def list_users(authorization: str | None = Header(default=None)):
    _require_admin(authorization)
    store = _read_store()
    users = sorted((_public_user(user) for user in store["users"].values()), key=lambda item: item["name"].lower())
    return {"users": users}


@router.post("/users")
def create_user(payload: CreateUserRequest, authorization: str | None = Header(default=None)):
    _require_admin(authorization)
    store = _read_store()
    username = _normalize_username(payload.username)
    key = username.lower()
    if key == ADMIN_USERNAME:
        raise HTTPException(status_code=400, detail="Usuario admin ja existe")
    if key in store["users"]:
        raise HTTPException(status_code=409, detail="Usuario ja existe")

    store["users"][key] = {
        "name": username,
        "role": "user",
        "passwordHash": _hash_password(payload.password),
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _write_store(store)
    return {"user": _public_user(store["users"][key])}
