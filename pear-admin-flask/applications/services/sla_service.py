"""
SLA服务类，负责工单SLA时间计算和状态管理
"""
import logging
from datetime import datetime, timedelta

from applications.extensions import db
from applications.models import Ticket, TicketFlow
from applications.models.admin_dept import Dept
from applications.models.admin_user import User

logger = logging.getLogger(__name__)

class SLAService:
    
    # SLA时间配置（根据新规则）
    # 业务恢复时间配置
    BUSINESS_RECOVERY_CONFIG = {
        'P1': {'hours': 8, 'days': 0},      # 8小时
        'P2': {'hours': 0, 'days': 2},      # 2个工作日
        'P3': {'hours': 0, 'days': 4},      # 4个工作日
        'P4': {'hours': 0, 'days': 0}       # 暂未定义
    }
    
    # 彻底修复时间配置
    COMPLETE_FIX_CONFIG = {
        'P1': {'hours': 0, 'days': 5},      # 5个工作日
        'P2': {'hours': 0, 'days': 10},     # 10个工作日
        'P3': {'hours': 0, 'days': 20},     # 20个工作日
        'P4': {'hours': 0, 'days': 30}      # 30个工作日
    }
    
    @staticmethod
    def init_ticket_sla(ticket):
        """初始化工单SLA时间"""
        try:
            priority = ticket.priority or 'P3'
            
            # 设置业务恢复截止时间
            business_recovery_config = SLAService.BUSINESS_RECOVERY_CONFIG.get(priority, SLAService.BUSINESS_RECOVERY_CONFIG['P3'])
            if ticket.create_time:
                # 计算业务恢复截止时间（从创建时间开始）
                business_recovery_hours = business_recovery_config['hours']
                business_recovery_days = business_recovery_config['days']
                ticket.business_recovery_deadline = ticket.create_time + timedelta(hours=business_recovery_hours, days=business_recovery_days)
                
                # 设置彻底修复截止时间
                complete_fix_config = SLAService.COMPLETE_FIX_CONFIG.get(priority, SLAService.COMPLETE_FIX_CONFIG['P3'])
                complete_fix_hours = complete_fix_config['hours']
                complete_fix_days = complete_fix_config['days']
                ticket.complete_fix_deadline = ticket.create_time + timedelta(hours=complete_fix_hours, days=complete_fix_days)
            
            # 初始责任部门为技术支持部
            ticket.current_sla_dept = '技术支持部'
            
            logger.info(f"初始化工单 {ticket.id} SLA: 优先级{priority}, 业务恢复截止时间 {ticket.business_recovery_deadline}, 彻底修复截止时间 {ticket.complete_fix_deadline}")
            return True
            
        except Exception as e:
            logger.error(f"初始化工单SLA失败 {ticket.id}: {e}")
            return False
    
    @staticmethod
    def update_sla_on_status_change(ticket, old_status, new_status, handler=None):
        """状态变更时更新SLA时间"""
        try:
            current_time = datetime.now()
            priority = ticket.priority or 'P3'
            
            # 业务恢复时间记录：当状态变为"已关闭"、"已处理"或"暂时规避"
            if new_status in ['已关闭', '已处理', '暂时规避'] and not ticket.business_recovery_time:
                ticket.business_recovery_time = current_time
                logger.info(f"工单 {ticket.id} 业务恢复时间: {current_time}")
            
            # 根据状态设置责任部门（业务恢复超时）
            if new_status in ['未完成-客户原因']:
                ticket.current_sla_dept = '客户'
            elif new_status in ['未完成-研发原因']:
                ticket.current_sla_dept = '研发部'
            elif new_status in ['未完成-生产原因']:
                ticket.current_sla_dept = '质量部'
            elif new_status in ['未完成-售后原因', '处理中']:
                ticket.current_sla_dept = '技术支持部'
            
            # 彻底修复超时的责任部门判定（基于问题分类）
            # 如果已选择"暂时规避"，需要根据问题分类进一步归因
            if new_status == '暂时规避' and hasattr(ticket, 'problem_classification_main'):
                problem_category = ticket.problem_classification_main or ''
                if any(keyword in problem_category for keyword in ['软件 Bug-新 Bug', '需研发升级包', 'Bug 开发中']):
                    ticket.current_sla_dept = '研发部'
                elif any(keyword in problem_category for keyword in ['硬件']):
                    ticket.current_sla_dept = '质量部'
                elif '环境类-客户环境问题' in problem_category:
                    ticket.current_sla_dept = '客户'
                elif '新需求' in problem_category:
                    # 新需求不计超时
                    ticket.is_overdue = False
                else:
                    ticket.current_sla_dept = '技术支持部'
            
            # 检查并更新超时状态
            SLAService.check_sla_timeout(ticket)
            
            # 使用flush确保修改被保存到session中，但不提交
            from applications.extensions import db
            db.session.flush()
            
            return True
            
        except Exception as e:
            logger.error(f"更新SLA状态失败 {ticket.id}: {e}")
            return False
    
    @staticmethod
    def check_sla_timeout(ticket):
        """检查SLA超时状态（从工单创建开始累计计算总时间）"""
        try:
            current_time = datetime.now()
            is_overdue = False
            overdue_info = []
            
            # 获取工单创建时间作为累计计算的起点
            ticket_create_time = ticket.create_time
            if not ticket_create_time:
                logger.warning(f"工单 {ticket.id} 没有创建时间，无法计算SLA")
                return False, []
            
            # 按部门累计计算超时时间
            department_overdue = {}
            
            # 获取工单的所有流程记录，按时间排序
            flows = TicketFlow.query.filter_by(ticket_id=ticket.id).order_by(TicketFlow.create_time).all()
            
            # 计算累计时间：从工单创建到当前时间的总时长
            cumulative_duration = current_time - ticket_create_time
            cumulative_hours = cumulative_duration.total_seconds() / 3600
            cumulative_days = cumulative_hours / 24
            
            # 检查业务恢复阶段超时（基于累计时间）
            if ticket.business_recovery_deadline and not ticket.business_recovery_time:
                # 计算业务恢复SLA阈值（小时）
                priority = ticket.priority or 'P3'
                business_config = SLAService.BUSINESS_RECOVERY_CONFIG.get(priority, SLAService.BUSINESS_RECOVERY_CONFIG['P3'])
                business_sla_hours = business_config['hours'] + business_config['days'] * 24
                
                # 判断累计时间是否超过业务恢复SLA阈值
                if cumulative_hours > business_sla_hours:
                    is_overdue = True
                    
                    # 计算超时时间
                    overdue_hours = cumulative_hours - business_sla_hours
                    overdue_days = overdue_hours / 24
                    
                    # 根据当前状态确定超时原因
                    if ticket.status == '未完成-客户原因':
                        reason = "客户原因"
                        dept = '客户'
                    elif ticket.status == '未完成-研发原因':
                        reason = "研发原因"
                        dept = '研发部'
                    elif ticket.status == '未完成-生产原因':
                        reason = "生产原因"
                        dept = '质量部'
                    elif ticket.status in ['未完成-售后原因', '处理中']:
                        reason = "技术支持部原因"
                        dept = '技术支持部'
                    else:
                        reason = "未知原因"
                        dept = '技术支持部'
                    
                    if business_config['days'] > 0:
                        time_str = f"{overdue_days:.1f}天"
                    else:
                        time_str = f"{overdue_hours:.1f}小时"
                    
                    overdue_info.append(f"因{reason}导致业务恢复超时 {time_str}")
                    
                    # 累计部门超时时间
                    if dept not in department_overdue:
                        department_overdue[dept] = 0.0
                    department_overdue[dept] += overdue_hours
            
            # 检查彻底修复阶段超时（基于累计时间）
            if ticket.complete_fix_deadline and ticket.status not in ['已关闭', '已处理']:
                # 计算彻底修复SLA阈值（小时）
                priority = ticket.priority or 'P3'
                complete_config = SLAService.COMPLETE_FIX_CONFIG.get(priority, SLAService.COMPLETE_FIX_CONFIG['P3'])
                complete_sla_hours = complete_config['hours'] + complete_config['days'] * 24
                
                # 判断累计时间是否超过彻底修复SLA阈值
                if cumulative_hours > complete_sla_hours:
                    is_overdue = True
                    
                    # 计算超时时间
                    overdue_hours = cumulative_hours - complete_sla_hours
                    overdue_days = overdue_hours / 24
                    
                    # 确定责任部门
                    if ticket.status == '暂时规避' and hasattr(ticket, 'problem_classification_main'):
                        problem_category = ticket.problem_classification_main or ''
                        if any(keyword in problem_category for keyword in ['软件 Bug-新 Bug', '需研发升级包', 'Bug 开发中']):
                            dept = '研发部'
                        elif any(keyword in problem_category for keyword in ['硬件']):
                            dept = '质量部'
                        elif '环境类-客户环境问题' in problem_category:
                            dept = '客户'
                        elif '新需求' in problem_category:
                            # 新需求不计超时
                            is_overdue = False
                            overdue_hours = 0
                        else:
                            dept = ticket.current_sla_dept or '技术支持部'
                    else:
                        dept = ticket.current_sla_dept or '技术支持部'
                    
                    if complete_config['days'] > 0:
                        time_str = f"{overdue_days:.1f}天"
                    else:
                        time_str = f"{overdue_hours:.1f}小时"
                    
                    if is_overdue:
                        overdue_info.append(f"因{dept}导致彻底修复超时 {time_str}")
                        
                        # 累计部门超时时间
                        if dept not in department_overdue:
                            department_overdue[dept] = 0.0
                        department_overdue[dept] += overdue_hours
            
            # 添加部门累计超时信息
            if department_overdue:
                for dept, hours in department_overdue.items():
                    if hours > 0:
                        if hours < 24:
                            overdue_info.append(f"{dept}累计超时 {hours:.1f}小时")
                        else:
                            overdue_info.append(f"{dept}累计超时 {hours/24:.1f}天")
            
            ticket.is_overdue = is_overdue
            
            if is_overdue:
                logger.warning(f"工单 {ticket.id} SLA超时（累计时间{cumulative_hours:.1f}小时）: {', '.join(overdue_info)}, 责任部门: {ticket.current_sla_dept}")
            
            return is_overdue, overdue_info
            
        except Exception as e:
            logger.error(f"检查SLA超时失败 {ticket.id}: {e}")
            return False, []
    
    @staticmethod
    def record_business_recovery(ticket_id, recovery_time=None):
        """记录业务恢复时间"""
        try:
            ticket = Ticket.query.get(ticket_id)
            if not ticket:
                return False, "工单不存在"
            
            if not recovery_time:
                recovery_time = datetime.now()
            
            ticket.business_recovery_time = recovery_time
            db.session.add(ticket)
            db.session.commit()
            
            logger.info(f"工单 {ticket_id} 业务恢复时间记录: {recovery_time}")
            return True, "业务恢复时间记录成功"
            
        except Exception as e:
            logger.error(f"记录业务恢复时间失败 {ticket_id}: {e}")
            return False, str(e)
    
    @staticmethod
    def get_sla_status_info(ticket):
        """获取SLA状态信息（从工单创建开始累计计算总时间）"""
        try:
            current_time = datetime.now()
            priority = ticket.priority or 'P3'
            
            # 获取业务恢复和彻底修复配置
            business_recovery_config = SLAService.BUSINESS_RECOVERY_CONFIG.get(priority, SLAService.BUSINESS_RECOVERY_CONFIG['P3'])
            complete_fix_config = SLAService.COMPLETE_FIX_CONFIG.get(priority, SLAService.COMPLETE_FIX_CONFIG['P3'])
            
            status_info = {
                'responsible_department': ticket.current_sla_dept or '技术支持部',
                'business_recovery_time': None,
                'business_recovery_time_limit': business_recovery_config,
                'complete_fix_time': None,
                'complete_fix_time_limit': complete_fix_config,
                'business_recovery_status': '未开始',
                'complete_fix_status': '未开始',
                'overdue_items': [],
                'cumulative_hours': 0,  # 累计时间（小时）
                'cumulative_days': 0    # 累计时间（天）
            }
            
            # 计算累计时间：从工单创建到当前时间的总时长
            if ticket.create_time:
                cumulative_duration = current_time - ticket.create_time
                cumulative_hours = cumulative_duration.total_seconds() / 3600
                cumulative_days = cumulative_hours / 24
                status_info['cumulative_hours'] = round(cumulative_hours, 1)
                status_info['cumulative_days'] = round(cumulative_days, 1)
            
            # 业务恢复时间计算（基于累计时间）
            if ticket.business_recovery_time and ticket.create_time:
                recovery_duration = ticket.business_recovery_time - ticket.create_time
                recovery_hours = recovery_duration.total_seconds() / 3600
                recovery_days = recovery_hours / 24
                status_info['business_recovery_time'] = {
                    'hours': recovery_hours,
                    'days': recovery_days
                }
                status_info['business_recovery_status'] = '已恢复'
            elif ticket.create_time and ticket.business_recovery_deadline:
                # 计算业务恢复SLA阈值（小时）
                business_sla_hours = business_recovery_config['hours'] + business_recovery_config['days'] * 24
                
                # 判断累计时间是否超过业务恢复SLA阈值
                if cumulative_hours > business_sla_hours:
                    status_info['business_recovery_status'] = '已超时'
                    # 计算超时时间（基于累计时间）
                    overdue_hours = cumulative_hours - business_sla_hours
                    overdue_days = overdue_hours / 24
                    
                    # 根据当前状态确定超时原因
                    if ticket.status == '未完成-客户原因':
                        reason = "客户原因"
                    elif ticket.status == '未完成-研发原因':
                        reason = "研发原因"
                    elif ticket.status == '未完成-生产原因':
                        reason = "生产原因"
                    elif ticket.status in ['未完成-售后原因', '处理中']:
                        reason = "技术支持部原因"
                    else:
                        reason = "未知原因"
                    
                    if business_recovery_config['days'] > 0:
                        time_str = f"{overdue_days:.1f}天"
                    else:
                        time_str = f"{overdue_hours:.1f}小时"
                    
                    status_info['overdue_items'].append(f"因{reason}导致业务恢复超时 {time_str}")
                else:
                    # 计算已用时间
                    elapsed_duration = current_time - ticket.create_time
                    elapsed_hours = elapsed_duration.total_seconds() / 3600
                    elapsed_days = elapsed_hours / 24
                    status_info['business_recovery_time'] = {
                        'hours': elapsed_hours,
                        'days': elapsed_days
                    }
            
            # 彻底修复时间计算（基于累计时间）
            if ticket.completion_time and ticket.create_time:
                fix_duration = ticket.completion_time - ticket.create_time
                fix_hours = fix_duration.total_seconds() / 3600
                fix_days = fix_hours / 24
                status_info['complete_fix_time'] = {
                    'hours': fix_hours,
                    'days': fix_days
                }
                status_info['complete_fix_status'] = '已完成'
            elif ticket.create_time and ticket.complete_fix_deadline:
                # 计算彻底修复SLA阈值（小时）
                complete_sla_hours = complete_fix_config['hours'] + complete_fix_config['days'] * 24
                
                # 判断累计时间是否超过彻底修复SLA阈值
                if cumulative_hours > complete_sla_hours:
                    status_info['complete_fix_status'] = '已超时'
                    # 计算超时时间（基于累计时间）
                    overdue_hours = cumulative_hours - complete_sla_hours
                    overdue_days = overdue_hours / 24
                    
                    # 如果已选择"暂时规避"，说明业务曾恢复但未彻底修复
                    if ticket.status == '暂时规避' and hasattr(ticket, 'problem_classification_main'):
                        problem_category = ticket.problem_classification_main or ''
                        if any(keyword in problem_category for keyword in ['软件 Bug-新 Bug', '需研发升级包', 'Bug 开发中']):
                            reason = "研发部门"
                        elif any(keyword in problem_category for keyword in ['硬件']):
                            reason = "生产部门"
                        elif '环境类-客户环境问题' in problem_category:
                            reason = "客户"
                        elif '新需求' in problem_category:
                            # 新需求不计超时
                            reason = None
                        else:
                            reason = "技术支持部门"
                        
                        if reason:
                            status_info['overdue_items'].append(f"因{reason}导致彻底修复超时 {overdue_days:.1f}天")
                    else:
                        # 其他状态下的彻底修复超时
                        status_info['overdue_items'].append(f"因{ticket.current_sla_dept}导致彻底修复超时 {overdue_days:.1f}天")
                else:
                    # 计算已用时间
                    elapsed_duration = current_time - ticket.create_time
                    elapsed_hours = elapsed_duration.total_seconds() / 3600
                    elapsed_days = elapsed_hours / 24
                    status_info['complete_fix_time'] = {
                        'hours': elapsed_hours,
                        'days': elapsed_days
                    }
            
            return status_info
            
        except Exception as e:
            logger.error(f"获取SLA状态信息失败 {ticket.id}: {e}")
            return {'error': str(e)}
    
    @staticmethod
    def get_department_sla_stats(department, start_date=None, end_date=None):
        """获取部门SLA统计信息"""
        try:
            query = Ticket.query.filter(Ticket.current_sla_dept == department)
            
            if start_date:
                query = query.filter(Ticket.create_time >= start_date)
            if end_date:
                query = query.filter(Ticket.create_time <= end_date)
            
            tickets = query.all()
            
            total = len(tickets)
            business_recovery_overdue = 0
            complete_fix_overdue = 0
            business_recovery_on_time = 0
            complete_fix_on_time = 0
            
            for ticket in tickets:
                # 业务恢复超时统计
                if ticket.business_recovery_deadline:
                    if ticket.business_recovery_time:
                        # 已恢复，检查是否按时
                        if ticket.business_recovery_time <= ticket.business_recovery_deadline:
                            business_recovery_on_time += 1
                        else:
                            business_recovery_overdue += 1
                    else:
                        # 未恢复，检查是否超时
                        if datetime.now() > ticket.business_recovery_deadline:
                            business_recovery_overdue += 1
                        else:
                            business_recovery_on_time += 1
                
                # 彻底修复超时统计
                if ticket.complete_fix_deadline:
                    if ticket.completion_time and ticket.status in ['已关闭', '已处理']:
                        # 已完成，检查是否按时
                        if ticket.completion_time <= ticket.complete_fix_deadline:
                            complete_fix_on_time += 1
                        else:
                            complete_fix_overdue += 1
                    elif ticket.status not in ['已关闭', '已处理']:
                        # 未完成，检查是否超时
                        if datetime.now() > ticket.complete_fix_deadline:
                            complete_fix_overdue += 1
                        else:
                            complete_fix_on_time += 1
            
            stats = {
                'total_tickets': total,
                'business_recovery_overdue': business_recovery_overdue,
                'complete_fix_overdue': complete_fix_overdue,
                'business_recovery_on_time': business_recovery_on_time,
                'complete_fix_on_time': complete_fix_on_time,
                'business_recovery_overdue_rate': business_recovery_overdue / total * 100 if total > 0 else 0,
                'complete_fix_overdue_rate': complete_fix_overdue / total * 100 if total > 0 else 0,
                'business_recovery_on_time_rate': business_recovery_on_time / total * 100 if total > 0 else 0,
                'complete_fix_on_time_rate': complete_fix_on_time / total * 100 if total > 0 else 0
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"获取部门SLA统计失败 {department}: {e}")
            return {'error': str(e)}
    
    @staticmethod
    def calculate_ticket_overdue_status(ticket_dict: dict) -> dict:
        """
        计算单个工单的超时状态
        
        :param ticket_dict: 工单字典数据
        :return: 包含 is_overdue 和 overdue_hours 的字典
        """
        is_overdue = False
        ticket_id = ticket_dict.get('id')
        
        if not ticket_id:
            return {'is_overdue': False, 'overdue_hours': 0}
        
        flows = TicketFlow.query.filter_by(ticket_id=ticket_id).order_by(TicketFlow.create_time).all()
        if not flows:
            return {'is_overdue': False, 'overdue_hours': 0}
        
        has_temporary_solution = False
        for f in flows:
            if f.to_status == '暂时规避' or (f.flow_mode and '临时' in f.flow_mode):
                has_temporary_solution = True
                break
        
        priority = ticket_dict.get('priority', 'P4')
        business_recovery_thresholds = {'P1': 8, 'P2': 24, 'P3': 48, 'P4': 72}
        complete_fix_thresholds = {'P1': 24, 'P2': 72, 'P3': 120, 'P4': 168}
        
        prev_flow_time = None
        has_temporary_solution_flag = False
        
        for flow in flows:
            is_current_temporary = (
                flow.to_status == '暂时规避' or 
                (flow.flow_mode and '临时' in flow.flow_mode)
            )
            
            if has_temporary_solution_flag or is_current_temporary:
                sla_threshold = complete_fix_thresholds.get(priority, 24)
            else:
                sla_threshold = business_recovery_thresholds.get(priority, 24)
            
            if prev_flow_time and flow.create_time:
                time_elapsed = (flow.create_time - prev_flow_time).total_seconds()
                if time_elapsed > sla_threshold * 3600:
                    is_overdue = True
                    break
            
            prev_flow_time = flow.create_time
            if is_current_temporary:
                has_temporary_solution_flag = True
        
        if not is_overdue and prev_flow_time and ticket_dict.get('status') not in ['已关闭', '已解决']:
            now = datetime.now()
            if has_temporary_solution_flag:
                sla_threshold = complete_fix_thresholds.get(priority, 24)
            else:
                sla_threshold = business_recovery_thresholds.get(priority, 24)
            
            time_elapsed = (now - prev_flow_time).total_seconds()
            if time_elapsed > sla_threshold * 3600:
                is_overdue = True
        
        return {'is_overdue': is_overdue, 'overdue_hours': 0}