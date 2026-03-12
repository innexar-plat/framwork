"""Email service — welcome tenant, briefing notification, provisioning failed."""

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.config import get_settings

logger = logging.getLogger(__name__)


class EmailService:
    """Send transactional emails via SMTP."""

    def __init__(self) -> None:
        self._settings = get_settings()

    async def _send(self, to: str, subject: str, html_body: str) -> None:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self._settings.smtp_from
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))
        kwargs = {
            "hostname": self._settings.smtp_host,
            "port": self._settings.smtp_port,
        }
        if self._settings.smtp_user:
            kwargs["username"] = self._settings.smtp_user
        if self._settings.smtp_pass:
            kwargs["password"] = self._settings.smtp_pass
        await aiosmtplib.send(msg, **kwargs)

    async def send_test_email(self, to: str) -> None:
        """Send a test email to verify SMTP configuration."""
        await self._send(
            to=to,
            subject="WaaS — Test email",
            html_body="<p>This is a test email from your WaaS platform.</p>",
        )

    async def send_welcome_tenant(
        self,
        to_email: str,
        name: str,
        panel_url: str,
        subdomain: str,
        temp_password: str,
    ) -> None:
        """Send welcome email to new tenant admin with panel URL and temp password."""
        base = get_settings().site_base_domain
        site_url = f"https://{subdomain}.{base}" if subdomain else panel_url
        html = f"""
        <!DOCTYPE html><html><body style="font-family:sans-serif;">
        <h2>Welcome to your new site</h2>
        <p>Hi {name},</p>
        <p>Your site is ready.</p>
        <ul>
          <li><strong>Panel:</strong> <a href="{panel_url}">{panel_url}</a></li>
          <li><strong>Site:</strong> <a href="{site_url}">{site_url}</a></li>
        </ul>
        <p>Use this temporary password to log in (change it after first login):</p>
        <p><code>{temp_password}</code></p>
        <p>Best regards,<br>WaaS Team</p>
        </body></html>
        """
        await self._send(to_email, "Welcome — your site is ready", html)

    async def send_briefing_notification(self, operator_email: str, briefing: dict) -> None:
        """Notify operator that a new briefing was submitted."""
        name = briefing.get("client_name", "—")
        email = briefing.get("client_email", "—")
        plan = briefing.get("plan_code", "—")
        html = f"""
        <!DOCTYPE html><html><body style="font-family:sans-serif;">
        <h2>New briefing submitted</h2>
        <p>Client: {name} &lt;{email}&gt;</p>
        <p>Plan: {plan}</p>
        <p>Review and provision from the platform panel.</p>
        </body></html>
        """
        await self._send(operator_email, "New briefing submitted", html)

    async def send_provisioning_failed(
        self,
        to_email: str,
        briefing_id: str,
        error: str,
    ) -> None:
        """Notify client that provisioning failed."""
        html = f"""
        <!DOCTYPE html><html><body style="font-family:sans-serif;">
        <h2>Provisioning issue</h2>
        <p>We encountered an issue while setting up your site (briefing #{briefing_id}).</p>
        <p>Our team has been notified. We will contact you shortly.</p>
        <p>Error reference: {error[:200]}</p>
        </body></html>
        """
        await self._send(to_email, "Provisioning update", html)
