"""
SQLAlchemy models for SmartHealth PWA backend.
Defines Center, Worker, Patient, Encounter, Vital, and ReferralPass tables.
"""
import enum
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SqlEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from database import Base


# ==========================================
# Enumerations
# ==========================================

class WorkerRole(str, enum.Enum):
    CHEW = "CHEW"          # Community Health Extension Worker
    TBA = "TBA"            # Traditional Birth Attendant
    OIC_NURSE = "OIC_NURSE"  # Officer-in-Charge / Nurse
    ADMIN = "ADMIN"        # Center / System Admin


class TriageTier(str, enum.Enum):
    GREEN = "GREEN"  # Non-urgent / mild condition
    AMBER = "AMBER"  # Moderate urgency / close monitoring
    RED = "RED"      # Critical / immediate referral


class EncounterStatus(str, enum.Enum):
    PENDING_SYNC = "PENDING_SYNC"
    COMPLETED = "COMPLETED"
    REFERRED = "REFERRED"


class ArrivalStatus(str, enum.Enum):
    ISSUED = "ISSUED"
    ARRIVED = "ARRIVED"
    TREATED = "TREATED"


# ==========================================
# SQLAlchemy Models
# ==========================================

class Center(Base):
    __tablename__ = "centers"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    center_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    lga = Column(String(100), nullable=False)  # Local Government Area
    state = Column(String(100), nullable=False)
    contact_phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    workers = relationship(
        "Worker",
        back_populates="center",
        cascade="all, delete-orphan",
    )
    referral_passes_received = relationship(
        "ReferralPass",
        back_populates="destination_center",
        foreign_keys="[ReferralPass.destination_center_id]",
    )

    def __repr__(self) -> str:
        return f"<Center(id={self.id}, code='{self.center_code}', name='{self.name}')>"


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    center_id = Column(Uuid, ForeignKey("centers.id", ondelete="RESTRICT"), nullable=False)
    role = Column(
        SqlEnum(WorkerRole, native_enum=False),
        default=WorkerRole.CHEW,
        nullable=False,
    )
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(30), nullable=True)
    license_number = Column(String(100), unique=True, index=True, nullable=True)
    pin_hash = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Relationships
    center = relationship("Center", back_populates="workers")
    registered_patients = relationship(
        "Patient",
        back_populates="registered_by_worker",
        foreign_keys="[Patient.registered_by_worker_id]",
    )
    encounters = relationship(
        "Encounter",
        back_populates="worker",
        foreign_keys="[Encounter.worker_id]",
    )

    def __repr__(self) -> str:
        return f"<Worker(id={self.id}, name='{self.full_name}', role='{self.role}')>"


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    registered_by_worker_id = Column(
        Uuid,
        ForeignKey("workers.id", ondelete="SET NULL"),
        nullable=True,
    )
    full_name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    location = Column(String(255), nullable=True)

    # Relationships
    registered_by_worker = relationship("Worker", back_populates="registered_patients")
    encounters = relationship(
        "Encounter",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Patient(id={self.id}, name='{self.full_name}', age={self.age})>"


class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    patient_id = Column(Uuid, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    worker_id = Column(Uuid, ForeignKey("workers.id", ondelete="RESTRICT"), nullable=False)
    transcription_text = Column(Text, nullable=True)
    ai_clinical_notes = Column(Text, nullable=True)
    triage_tier = Column(
        SqlEnum(TriageTier, native_enum=False),
        default=TriageTier.GREEN,
        nullable=False,
    )
    status = Column(
        SqlEnum(EncounterStatus, native_enum=False),
        default=EncounterStatus.PENDING_SYNC,
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    patient = relationship("Patient", back_populates="encounters")
    worker = relationship("Worker", back_populates="encounters")
    vitals = relationship(
        "Vital",
        back_populates="encounter",
        cascade="all, delete-orphan",
    )
    referral_pass = relationship(
        "ReferralPass",
        back_populates="encounter",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Encounter(id={self.id}, triage='{self.triage_tier}', status='{self.status}')>"


class Vital(Base):
    __tablename__ = "vitals"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    encounter_id = Column(
        Uuid,
        ForeignKey("encounters.id", ondelete="CASCADE"),
        nullable=False,
    )
    temperature_c = Column(Float, nullable=True)
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    spo2_percent = Column(Integer, nullable=True)
    heart_rate_bpm = Column(Integer, nullable=True)

    # Relationships
    encounter = relationship("Encounter", back_populates="vitals")

    def __repr__(self) -> str:
        return (
            f"<Vital(id={self.id}, temp={self.temperature_c}C, "
            f"bp={self.systolic_bp}/{self.diastolic_bp}, spo2={self.spo2_percent}%)>"
        )


class ReferralPass(Base):
    __tablename__ = "referral_passes"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    encounter_id = Column(
        Uuid,
        ForeignKey("encounters.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    pass_code = Column(String(50), unique=True, index=True, nullable=False)
    destination_center_id = Column(
        Uuid,
        ForeignKey("centers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    arrival_status = Column(
        SqlEnum(ArrivalStatus, native_enum=False),
        default=ArrivalStatus.ISSUED,
        nullable=False,
    )

    # Relationships
    encounter = relationship("Encounter", back_populates="referral_pass")
    destination_center = relationship("Center", back_populates="referral_passes_received")

    def __repr__(self) -> str:
        return f"<ReferralPass(code='{self.pass_code}', status='{self.arrival_status}')>"
