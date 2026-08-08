from fastapi import APIRouter, status

from app.api.deps import CurrentUser, SessionDep
from app.schemas.patient import CreatePatientRequest, CreatePatientResponse
from app.services.patient import PatientService

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=CreatePatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(request: CreatePatientRequest, user: CurrentUser, session: SessionDep):
    service = PatientService(session)
    patient = await service.create_patient(request, user.id)
    return CreatePatientResponse(patient=patient)


@router.get("/{patient_id}", response_model=CreatePatientResponse)
async def get_patient(patient_id: str, user: CurrentUser, session: SessionDep):
    service = PatientService(session)
    patient = await service.get_patient(patient_id, user.id)
    return CreatePatientResponse(patient=patient)
