import enum


class LenderType(str, enum.Enum):
    MFI = "MFI"
    NBFC = "NBFC"
    SFB = "SFB"


class OfficerRole(str, enum.Enum):
    Officer = "Officer"
    Admin = "Admin"


class ScoreTier(str, enum.Enum):
    Building = "Building"
    Silver = "Silver"
    Gold = "Gold"


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    countered = "countered"
    approved = "approved"
    rejected = "rejected"
    expired = "expired"


class LoanStatus(str, enum.Enum):
    approved = "approved"
    disbursed = "disbursed"
    repaying = "repaying"
    closed = "closed"


class RepaymentStatus(str, enum.Enum):
    on_time = "on_time"
    late = "late"
    missed = "missed"
