import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.patient import PatientProfile
from app.repositories.patient import PatientRepository
from app.schemas.patient import CreatePatientRequest, PatientProfileSchema


class PatientService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = PatientRepository(session)

    async def create_patient(
        self, request: CreatePatientRequest, user_id: str
    ) -> PatientProfileSchema:
        existing = await self.repo.find_by_user_id(user_id)
        if existing is not None:
            raise ConflictError("Patient profile already exists")

        patient = PatientProfile(
            id=str(uuid.uuid4()),
            name=request.name,
            gender=request.gender,
            birth_date=request.birth_date,
            phone=request.phone,
            diagnosis={  # 默认空诊断，待后续接口补全
                "diagnosedAt": "",
                "hoehnYahrStage": 1,
            },
            user_id=user_id,
        )
        await self.repo.save(patient)
        await self.session.commit()
        return PatientProfileSchema.model_validate(patient)

    async def get_patient(
        self, patient_id: str, current_user_id: str
    ) -> PatientProfileSchema:
        patient = await self.repo.find_by_id(patient_id)
        if patient is None:
            raise NotFoundError("Patient", patient_id)
        if patient.user_id != current_user_id:
            raise ForbiddenError("Not your patient profile")
        return PatientProfileSchema.model_validate(patient)
