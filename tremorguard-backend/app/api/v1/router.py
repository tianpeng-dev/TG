from fastapi import APIRouter

from app.api.v1 import auth, devices, health, me, patients

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(me.router)
api_router.include_router(patients.router)
api_router.include_router(devices.router)
