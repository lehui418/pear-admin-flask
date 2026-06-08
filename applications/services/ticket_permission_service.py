from dataclasses import dataclass

from applications.models import Dept


RD_KEYWORDS = ("研发", "开发")
QUALITY_KEYWORDS = ("质量", "质检", "品控")
RD_RELATED_CLASSIFICATIONS = (
    "软件bug-新bug需研发提供升级包",
    "bug开发中",
    "死机问题",
)
QUALITY_RELATED_CLASSIFICATIONS = (
    "软件bug-需寄回升级包",
    "硬件",
)


@dataclass
class TicketPermissionContext:
    is_authenticated: bool
    is_admin: bool
    is_owner: bool
    is_assignee: bool
    is_rd_member: bool
    is_quality_member: bool


@dataclass
class TicketPermissionResult:
    allowed: bool
    message: str = ""


class TicketPermissionService:
    @staticmethod
    def build_context(user, ticket, is_assignee_hint: bool = False) -> TicketPermissionContext:
        dept_name = TicketPermissionService._get_dept_name(user)
        username = getattr(user, "username", None)
        user_id = getattr(user, "id", None)
        ticket_user_id = getattr(ticket, "user_id", None)
        ticket_assignee = getattr(ticket, "assignee_name", None)
        is_authenticated = bool(getattr(user, "is_authenticated", False))

        return TicketPermissionContext(
            is_authenticated=is_authenticated,
            is_admin=username == "admin",
            is_owner=bool(ticket_user_id and user_id and ticket_user_id == user_id),
            is_assignee=bool(
                is_assignee_hint
                or (ticket_assignee and username and ticket_assignee == username)
            ),
            is_rd_member=any(keyword in dept_name for keyword in RD_KEYWORDS),
            is_quality_member=any(keyword in dept_name for keyword in QUALITY_KEYWORDS),
        )

    @staticmethod
    def can_edit_ticket(user, ticket, is_assignee_hint: bool = False) -> TicketPermissionResult:
        context = TicketPermissionService.build_context(
            user, ticket, is_assignee_hint=is_assignee_hint
        )
        if not context.is_authenticated:
            return TicketPermissionResult(False, "您需要登录才能编辑工单")

        if context.is_admin or context.is_owner or context.is_assignee:
            return TicketPermissionResult(True)

        status = getattr(ticket, "status", "") or ""
        problem_classification = getattr(ticket, "problem_classification_main", "") or ""

        if status == "未完成-研发原因":
            if context.is_rd_member:
                return TicketPermissionResult(True)
            return TicketPermissionResult(
                False, "权限不足：只有研发部门成员可以编辑状态为'未完成-研发原因'的工单"
            )

        if status == "暂时规避":
            if not context.is_rd_member:
                return TicketPermissionResult(
                    False, "权限不足：只有研发部门成员可以编辑状态为'暂时规避'的工单"
                )
            if TicketPermissionService.is_rd_related(problem_classification):
                return TicketPermissionResult(True)
            return TicketPermissionResult(
                False,
                "权限不足：暂时规避状态的工单需要问题分类为研发相关类型（软件bug-新bug需研发提供升级包、bug开发中、死机问题）",
            )

        if TicketPermissionService.is_quality_related(ticket):
            if context.is_quality_member:
                return TicketPermissionResult(True)
            return TicketPermissionResult(
                False, "权限不足：只有质量部门成员可以编辑此类工单"
            )

        return TicketPermissionResult(
            False, "您没有权限编辑此工单，只能编辑自己创建的工单或自己负责的工单"
        )

    @staticmethod
    def can_delete_ticket(user, ticket, is_assignee_hint: bool = False) -> TicketPermissionResult:
        context = TicketPermissionService.build_context(
            user, ticket, is_assignee_hint=is_assignee_hint
        )
        if not context.is_authenticated:
            return TicketPermissionResult(False, "您需要登录才能删除工单")
        if context.is_admin or context.is_owner or context.is_assignee:
            return TicketPermissionResult(True)
        return TicketPermissionResult(False, "您没有权限删除此工单")

    @staticmethod
    def get_user_department_flags(user) -> tuple[bool, bool]:
        dept_name = TicketPermissionService._get_dept_name(user)
        return (
            any(keyword in dept_name for keyword in RD_KEYWORDS),
            any(keyword in dept_name for keyword in QUALITY_KEYWORDS),
        )

    @staticmethod
    def is_rd_related(problem_classification) -> bool:
        value = (problem_classification or "").lower()
        return any(keyword.lower() in value for keyword in RD_RELATED_CLASSIFICATIONS)

    @staticmethod
    def is_quality_related(ticket) -> bool:
        status = getattr(ticket, "status", "") or ""
        problem_classification = getattr(ticket, "problem_classification_main", "") or ""
        return status == "未完成-生产原因" or any(
            keyword in problem_classification
            for keyword in QUALITY_RELATED_CLASSIFICATIONS
        )

    @staticmethod
    def _get_dept_name(user) -> str:
        dept = getattr(user, "dept", None)
        if dept and getattr(dept, "dept_name", None):
            return dept.dept_name
        dept_id = getattr(user, "dept_id", None)
        if dept_id:
            dept = Dept.query.get(dept_id)
            if dept and getattr(dept, "dept_name", None):
                return dept.dept_name
        return ""
