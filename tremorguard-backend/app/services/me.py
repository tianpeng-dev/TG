"""/me 服务 —— 推导 onboarding 状态"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.device import DeviceBindingRepository
from app.repositories.patient import PatientRepository
from app.schemas.me import MeResponse
from app.schemas.patient import PatientProfileSchema
from app.schemas.user import OnboardingStatusSchema, UserSchema


class MeService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.patient_repo = PatientRepository(session)
        self.binding_repo = DeviceBindingRepository(session)

    async def get_me(self, user: User) -> MeResponse:
        profile = await self.patient_repo.find_by_user_id(user.id)
        has_profile = profile is not None

        has_device = False
        if has_profile:
            active_bindings = await self.binding_repo.find_active_by_patient(profile.id)  # type: ignore[arg-type]
            has_device = len(active_bindings) > 0

        if not has_profile:
            status = "PROFILE_PENDING"
        elif not has_device:
            status = "DEVICE_PENDING"
        else:
            status = "COMPLETED"

        return MeResponse(
            user=UserSchema.model_validate(user),
            onboarding=OnboardingStatusSchema(
                status=status,
                has_profile=has_profile,
                has_device=has_device,
            ),
            patient=PatientProfileSchema.model_validate(profile) if has_profile else None,
        )
