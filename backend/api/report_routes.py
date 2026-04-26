import logging
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.deps import require_user
from auth.utils import load_users
from db import save_report, get_reports, get_report, delete_report, update_report_status

log = logging.getLogger(__name__)

router = APIRouter(tags=["reports"])

class ReportData(BaseModel):
    meta: dict
    findings: list

@router.post("/reports")
async def save_user_report(
    data: ReportData,
    report_id: Optional[str] = None,
    username: str = Depends(require_user)
):
    """Save or update a report to the database."""
    r_id = report_id or str(uuid.uuid4())
    client_name = data.meta.get("client_name", "Unknown Client")
    project_id = data.meta.get("project_id", "Unknown Project")
    
    # If the report already exists, keep its status, else 'draft'
    existing = get_report(r_id)
    status = existing["status"] if existing else "draft"

    save_report(r_id, username, client_name, project_id, data.model_dump(), status)
    return {"message": "Report saved successfully", "id": r_id, "status": status}

@router.get("/reports")
async def list_reports(username: str = Depends(require_user)):
    """List reports. Admins see all, users see their own."""
    users = load_users()
    is_admin = users.get(username, {}).get("role") == "admin"
    reports = get_reports(admin=is_admin, username=username)
    return reports

@router.get("/reports/{report_id}")
async def load_user_report(report_id: str, username: str = Depends(require_user)):
    """Load a specific report."""
    data = get_report(report_id)
    if not data:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Check access: Admin or owner
    users = load_users()
    is_admin = users.get(username, {}).get("role") == "admin"
    
    # We need to know who owns it, get_reports can help or we fetch raw
    if not is_admin:
        reports = get_reports(admin=False, username=username)
        if not any(r["id"] == report_id for r in reports):
            raise HTTPException(status_code=403, detail="Forbidden")
            
    return {"meta": data["data"]["meta"], "findings": data["data"]["findings"], "status": data["status"]}

class StatusUpdate(BaseModel):
    status: str

@router.put("/reports/{report_id}/status")
async def update_status(report_id: str, req: StatusUpdate, username: str = Depends(require_user)):
    """Update report status (user: pending_approval, admin: approved/needs_change)."""
    users = load_users()
    role = users.get(username, {}).get("role")
    
    if role != "admin" and req.status not in ["pending_approval", "draft"]:
        raise HTTPException(status_code=403, detail="Only admins can approve/reject")
        
    update_report_status(report_id, req.status)
    return {"message": "Status updated", "status": req.status}

@router.delete("/reports/{report_id}")
async def delete_user_report(report_id: str, username: str = Depends(require_user)):
    """Delete a report."""
    users = load_users()
    is_admin = users.get(username, {}).get("role") == "admin"
    
    if not is_admin:
        reports = get_reports(admin=False, username=username)
        if not any(r["id"] == report_id for r in reports):
            raise HTTPException(status_code=403, detail="Forbidden")
            
    delete_report(report_id)
    return {"message": "Deleted successfully"}
