
layui.use(['form', 'layer', 'jquery', 'laydate', 'upload'], function () {
    // 定义全局变量basePath
    var basePath = '/';
    
    // 存储流程数据供点击使用
    var flowDataCache = null;
    
    // 工单流程记录展开状态 - 全局变量
    var flowLoaded = false;
    
    // 切换工单流程记录显示/隐藏 - 全局函数
    window.toggleFlowSection = function() {
        console.log('toggleFlowSection called');
        var container = document.getElementById('ticket-flow-container');
        var toggleText = document.getElementById('flow-toggle-text');
        
        if (!container || !toggleText) {
            console.error('Elements not found:', container, toggleText);
            return;
        }
        
        if (container.style.display !== 'none') {
            // 隐藏
            container.style.display = 'none';
            toggleText.textContent = '展开';
        } else {
            // 显示
            container.style.display = 'block';
            toggleText.textContent = '关闭';
            
            // 如果还没有加载过数据，则触发加载
            if (!flowLoaded) {
                // 使用原生事件触发，避免jQuery未加载问题
                var event = document.createEvent('CustomEvent');
                event.initCustomEvent('loadTicketFlow', true, true, {});
                document.dispatchEvent(event);
                flowLoaded = true;
            }
        }
    };
    
    // 展开/折叠处理记录 - 全局函数
    window.toggleNotes = function(index) {
        var container = document.getElementById('notes-' + index);
        if (!container) return;
        var preview = container.querySelector('.flow-notes-preview');
        var full = container.querySelector('.flow-notes-full');
        var toggle = container.querySelector('.flow-notes-toggle');
        if (!preview || !full || !toggle) return;
        var isExpanded = toggle.getAttribute('data-expanded') === 'true';
        
        if (isExpanded) {
            // 折叠
            preview.style.display = 'block';
            full.style.display = 'none';
            toggle.innerHTML = '<i class="layui-icon layui-icon-down"></i> 展开全部';
            toggle.setAttribute('data-expanded', 'false');
            toggle.classList.remove('expanded');
        } else {
            // 展开
            preview.style.display = 'none';
            full.style.display = 'block';
            toggle.innerHTML = '<i class="layui-icon layui-icon-up"></i> 收起';
            toggle.setAttribute('data-expanded', 'true');
            toggle.classList.add('expanded');
        }
    };
    
    // 显示流程详情弹窗
    window.showFlowDetail = function(index) {
        if (!flowDataCache || !flowDataCache.flows || !flowDataCache.flows[index]) return;
        
        var flow = flowDataCache.flows[index];
        var content = '<div style="padding: 20px;">';
        
        // 标题
        content += '<h3 style="margin-bottom: 20px; color: #333; border-bottom: 2px solid #1E9FFF; padding-bottom: 10px;">步骤详情 #' + (index + 1) + '</h3>';
        
        // 基本信息
        content += '<div style="margin-bottom: 15px;">';
        content += '<p style="margin: 8px 0;"><strong style="color: #666; display: inline-block; width: 100px;">操作时间:</strong> <span style="color: #333;">' + (flow.create_time || '-') + '</span></p>';
        content += '<p style="margin: 8px 0;"><strong style="color: #666; display: inline-block; width: 100px;">操作人:</strong> <span style="color: #333;">' + (flow.handler || '-') + '</span></p>';
        content += '<p style="margin: 8px 0;"><strong style="color: #666; display: inline-block; width: 100px;">部门:</strong> <span style="color: #333;">' + (flow.department || '-') + '</span></p>';
        content += '<p style="margin: 8px 0;"><strong style="color: #666; display: inline-block; width: 100px;">处理模式:</strong> <span style="color: #1E9FFF;">' + (flow.flow_mode || '-') + '</span></p>';
        content += '</div>';
        
        // 状态变更
        if (flow.from_status && flow.to_status) {
            content += '<div style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 8px;">';
            content += '<p style="margin: 0;"><strong style="color: #666;">状态变更:</strong> ';
            content += '<span style="background: #999; color: #fff; padding: 2px 8px; border-radius: 4px; margin: 0 5px;">' + flow.from_status + '</span>';
            content += '<span style="color: #1E9FFF; font-weight: bold;">→</span>';
            content += '<span style="background: #5FB878; color: #fff; padding: 2px 8px; border-radius: 4px; margin: 0 5px;">' + flow.to_status + '</span>';
            content += '</p>';
            content += '</div>';
        }
        
        // 备注信息
        if (flow.notes) {
            content += '<div style="margin-bottom: 15px;">';
            content += '<p style="margin: 0 0 8px 0;"><strong style="color: #666;">备注:</strong></p>';
            content += '<div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 3px solid #1E9FFF; white-space: pre-wrap; word-break: break-word; max-height: 200px; overflow-y: auto;">' + flow.notes.replace(/\n/g, '<br>') + '</div>';
            content += '</div>';
        }
        
        // 超时信息
        if (flow.is_overdue) {
            content += '<div style="margin-bottom: 15px; padding: 10px; background: #ffebee; border: 1px solid #f44336; border-radius: 8px;">';
            content += '<p style="margin: 0; color: #c62828;"><i class="layui-icon layui-icon-time" style="margin-right: 5px;"></i><strong>超时预警:</strong> ' + (flow.responsible_department || '未知部门') + ' 在 ' + (flow.overdue_stage || '业务恢复阶段') + ' 超时 ' + (flow.overdue_hours || 0) + ' 小时</p>';
            content += '</div>';
        }
        
        content += '</div>';
        
        layui.layer.open({
            type: 1,
            title: '操作日志详情',
            area: ['600px', 'auto'],
            maxHeight: 500,
            content: content,
            btn: ['关闭'],
            btnAlign: 'c'
        });
    };
        var imageUrls = []; // 初始化 imageUrls 数组
        var form = layui.form,
            layer = layui.layer,
            $ = layui.jquery,
            laydate = layui.laydate,
            upload = layui.upload;
        var imageUrls = [];
        var initialProblemClassificationMain = $('input[name="problem_classification_main"]').val();

        // 动态设置处置方案字段的必填状态
        function updateSolutionRequirement() {
            var mainClassification = $('select[name="problem_classification_main"]').val();
            var solutionLabel = $('#solution_label');
            var solutionTextarea = $('textarea[name="solution"]');
            
            // 对于高风险安全事件，处置方案为必填
            var priority = $('select[name="priority"]').val();
            if (priority === 'High' || priority === 'Critical' || 
                ['恶意代码', '网络攻击', '信息泄露', '信息破坏'].includes(mainClassification)) {
                solutionLabel.html('处置方案 <span style="color: red;">*</span>');
                solutionTextarea.attr('lay-verify', 'required');
            } else {
                solutionLabel.html('处置方案');
                solutionTextarea.removeAttr('lay-verify');
            }
        }

        // 安全等级变化时更新页面显示
        function updateSecurityLevelDisplay(level) {
            var levelText = '';
            var levelColor = '';
            var description = '';
            
            switch(level) {
                case 'Low':
                    levelText = '低风险';
                    levelColor = '#5FB878';
                    description = '影响较小，可按正常流程处理';
                    break;
                case 'Medium':
                    levelText = '中风险';
                    levelColor = '#FFB800';
                    description = '需要及时关注和处理';
                    break;
                case 'High':
                    levelText = '高风险';
                    levelColor = '#FF5722';
                    description = '需要优先处理，加强监控';
                    break;
                case 'Critical':
                    levelText = '紧急';
                    levelColor = '#FF0000';
                    description = '立即响应，启动应急预案';
                    break;
                default:
                    levelText = '未定义';
                    levelColor = '#999';
                    description = '请选择安全等级';
            }
            
            $('#security-level').text(levelText).css('color', levelColor);
            $('#security-level-desc').text(description);
        }

        // CVSS评分验证和等级判定
        function validateCVSSScore(score) {
            if (score < 0 || score > 10) {
                layer.msg('CVSS评分必须在0-10之间', {icon: 2});
                return false;
            }
            
            var level = '';
            if (score >= 9.0) level = 'Critical';
            else if (score >= 7.0) level = 'High';
            else if (score >= 4.0) level = 'Medium';
            else level = 'Low';
            
            // 建议根据CVSS评分调整安全等级
            if (score > 0) {
                layer.msg('建议安全等级: ' + level, {icon: 1, time: 3000});
            }
            
            return true;
        }

        // Initial check
        updateSolutionRequirement();

        // 绑定安全等级变化事件
        form.on('select(securityLevel)', function(data) {
            updateSecurityLevelDisplay(data.value);
            updateSolutionRequirement();
            
            // 当优先级变更时，重新检查超时状态
            var timeoutInfo = checkTicketTimeout();
            if (timeoutInfo && timeoutInfo.isTimeout) {
                // 更新页面顶部的超时状态显示
                $('#timeout-status').text('已超时').css('color', '#FF5722');
                $('#timeout-duration').text(timeoutInfo.hours + '小时');
                
                // 更新超时横幅
                var titleColor = '#FF5722'; // 默认红色
                var timeoutClass = 'timeout-alert';
                
                switch(data.value) {
                    case 'Critical':
                        titleColor = '#FF0000';
                        timeoutClass += ' timeout-alert-critical';
                        break;
                    case 'High':
                        titleColor = '#FF5722';
                        timeoutClass += ' timeout-alert-high';
                        break;
                    case 'Medium':
                        titleColor = '#FFB800';
                        timeoutClass += ' timeout-alert-medium';
                        break;
                    case 'Low':
                        titleColor = '#1E9FFF';
                        timeoutClass += ' timeout-alert-low';
                        break;
                }
                
                // 显示简短提示
                layer.msg('工单优先级已更改，超时状态已更新', {icon: 0, time: 3000});
            }
        });


        // 绑定安全分类变化事件
        form.on('select(problem_classification_main)', function(data) {
            updateSolutionRequirement();
        });

        // CVSS评分输入验证
        $('input[name="cvss_score"]').on('blur', function() {
            var score = parseFloat($(this).val());
            if (!isNaN(score)) {
                validateCVSSScore(score);
            }
        });

        // 威胁类型变化时的处理
        form.on('select(threat_type)', function(data) {
            var threatType = data.value;
            // 根据威胁类型给出处置建议
            var suggestions = {
                '恶意软件': '建议立即隔离受感染系统，进行病毒查杀',
                '网络入侵': '建议检查网络日志，加强访问控制',
                '数据泄露': '建议立即评估泄露范围，通知相关人员',
                'DDoS攻击': '建议启用DDoS防护，联系网络服务商',
                '钓鱼攻击': '建议加强用户安全意识培训',
                '内部威胁': '建议审查内部权限，加强监控',
                '系统漏洞': '建议立即应用安全补丁',
                '配置错误': '建议检查系统配置，进行安全加固'
            };
            
            if (suggestions[threatType]) {
                layer.tips(suggestions[threatType], this, {
                    tips: [1, '#3595CC'],
                    time: 4000
                });
            }
        });

        // 初始化安全等级显示
        var initialPriority = $('select[name="priority"]').val();
        if (initialPriority) {
            updateSecurityLevelDisplay(initialPriority);
        }


        // 初始化日期选择器
        laydate.render({
            elem: '#appointment_time_picker',
            type: 'datetime',
            theme: '#1E9FFF'
        });
        laydate.render({
            elem: '#order_time_picker',
            type: 'datetime',
            theme: '#1E9FFF'
        });
        laydate.render({
            elem: '#completion_time_picker',
            type: 'datetime',
            theme: '#1E9FFF'
        });

        // 加载初始表单数据
        var ticketData = {};
        var addFormData = {};
        
        try {
            ticketData = TICKET_DATA_JSON || {};
        } catch (e) {
            console.error('解析ticketData失败:', e);
            ticketData = {};
        }
        
        try {
            addFormData = ADD_FORM_DATA || {};
        } catch (e) {
            console.error('解析addFormData失败:', e);
            addFormData = {};
        }

        // 调试日志
        console.log('解析后的ticketData:', ticketData);
        console.log('解析后的addFormData:', addFormData);
        console.log('初始隐藏id值:', $('input[name="id"]').val());
        
        // 检查是否有数据需要加载
        if (Object.keys(ticketData).length > 0 || Object.keys(addFormData).length > 0) {
            // 合并数据，优先使用ticketData中的值
            var formData = {};
            
            // 先加载add.html传来的数据（如果有）
            if (Object.keys(addFormData).length > 0) {
                formData = Object.assign({}, formData, addFormData);
                console.log('加载addFormData后的formData:', formData);
            }
            
            // 再加载ticket数据（如果有），覆盖add.html的数据
            if (Object.keys(ticketData).length > 0) {
                formData = Object.assign({}, formData, ticketData);
                console.log('加载ticketData后的formData:', formData);
            }
            
            // 将合并后的数据填充到表单
            console.log('即将设置到表单的数据:', formData);
            form.val("ticketConfigForm", formData);
            console.log('表单填充后的隐藏id值:', $('input[name="id"]').val());
            
            // 处理条件字段显示
            if (formData.service_method === '现场维修') {
                $('#appointment_time_field').show();
                $('#engineer_id_field').show();
            } else {
                $('#appointment_time_field').hide();
                $('#engineer_id_field').hide();
            }
            
            // 根据状态控制完成时间字段
            updateCompletionTimeField(formData.status);
        } else {
            console.log('没有ticketData或addFormData需要加载。');
        }

        // 处理"服务方式"变更的条件字段显示
        form.on('radio(serviceMethod)', function(data){
            if(data.value === '现场维修'){
                $('#appointment_time_field').show();
                $('#engineer_id_field').show();
            } else {
                $('#appointment_time_field').hide();
                $('#engineer_id_field').hide();
            }
            
            // 为"返厂"添加提示
            if(data.value === '返厂') {
                layer.tips('选择"返厂"服务方式，请记得在附件中上传设备检测报告。', $(data.elem).next('.layui-form-radio'), {tips: 1});
            } else {
                layer.closeAll('tips');
            }
        });
        
        // 处理状态变更
        form.on('select(statusSelect)', function(data){
            updateCompletionTimeField(data.value);
            
            // 工单已解决或关闭，显示完成提示
            if(data.value === '已解决' || data.value === '已关闭') {
                layer.msg('工单状态已更新为：' + data.value, {icon: 1, time: 2000});
            }
        });
        
        // 根据状态更新完成时间字段
        function updateCompletionTimeField(status) {
            if(status === 'Resolved' || status === 'Closed') {
                $('#completion_time_picker').removeAttr('disabled');
                if(!$('#completion_time_picker').val()) {
                    $('#completion_time_picker').val(formatDateTime(new Date()));
                }
            } else {
                $('#completion_time_picker').attr('disabled', 'disabled');
                $('#completion_time_picker').val('');
            }
            // 重新渲染表单
            form.render();
        }
        
        // 格式化日期时间
        function formatDateTime(date) {
            var year = date.getFullYear();
            var month = (date.getMonth() + 1).toString().padStart(2, '0');
            var day = date.getDate().toString().padStart(2, '0');
            var hours = date.getHours().toString().padStart(2, '0');
            var minutes = date.getMinutes().toString().padStart(2, '0');
            var seconds = date.getSeconds().toString().padStart(2, '0');
            return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
        }
        
        // 检查工单是否超时
        function checkTicketTimeout() {
            // 从全局变量获取后端计算的超时信息和工单状态、优先级
            var isOverdue = TICKET_IS_OVERDUE;
            var overdueHours = TICKET_OVERDUE_HOURS;
            var ticketStatus = TICKET_STATUS;
            var ticketPriority = TICKET_PRIORITY;
            var createTimeStr = TICKET_CREATE_TIME; // 仍然需要创建时间来计算应完成时间

            console.log('检查超时 - 后端is_overdue:', isOverdue);
            console.log('检查超时 - 后端overdue_hours:', overdueHours);
            console.log('检查超时 - 工单状态:', ticketStatus);
            console.log('检查超时 - 工单优先级:', ticketPriority);

            if (ticketStatus === 'Closed' || ticketStatus === '已关闭') {
                console.log('工单已关闭，不显示超时');
                return false;
            }

            if (isOverdue === true && typeof overdueHours === 'number' && overdueHours > 0) {
                console.log('工单已超时 ' + overdueHours + ' 小时');
                return {
                    isTimeout: true,
                    hours: overdueHours,
                    priority: ticketPriority
                };
            } else {
                console.log('工单未超时或超时小时数无效');
                return false;
            }
        }

        // 升级规则配置
        // person 字段使用真实姓名，用于消息通知查找用户
        const escalationRules = {
            'P1': {
                name: 'P1（严重）',
                levels: [
                    { hours: 8, action: '售后主管介入处理，2小时内同步客户初步结论', role: '售后主管', person: '史乐慧' },
                    { hours: 24, action: '邮件上报：技术支持部经理、销售经理、研发售后接口人（邮件含问题详情+当前进展），要求技术支持部经理1小时内介入', role: '技术支持部经理', person: 'fmz' },
                    { hours: 48, action: '邮件上报：抄送总经理，总经理1小时内介入处理', role: '总经理', person: '' },
                    { hours: 72, action: '启动紧急预案+全链路复盘', role: '全链路', person: '' }
                ]
            },
            'P2': {
                name: 'P2（高）',
                levels: [
                    { hours: 24, action: '售后主管介入处理，4小时内同步客户进展', role: '售后主管', person: '史乐慧' },
                    { hours: 48, action: '邮件上报：技术支持部经理、销售经理、研发售后接口人，要求技术支持部经理2小时内介入', role: '技术支持部经理', person: 'fmz' },
                    { hours: 72, action: '邮件上报：抄送总经理，总经理2小时内介入', role: '总经理', person: '' }
                ]
            }
        };

        // 计算升级规则显示
        function calculateEscalation() {
            var ticketPriority = TICKET_PRIORITY;
            var createTimeStr = TICKET_CREATE_TIME;

            // 只处理 P1 和 P2
            if (ticketPriority !== 'P1' && ticketPriority !== 'High' && ticketPriority !== 'P2' && ticketPriority !== 'Medium') {
                console.log('非P1/P2工单，不显示升级规则');
                return;
            }

            // 标准化优先级
            var normalizedPriority = (ticketPriority === 'High') ? 'P1' : (ticketPriority === 'Medium') ? 'P2' : ticketPriority;
            var rule = escalationRules[normalizedPriority];
            if (!rule) return;

            var createDate = new Date(createTimeStr.replace('T', ' ').replace(/-/g, '/'));
            var now = new Date();
            var elapsedHours = Math.floor((now - createDate) / (1000 * 60 * 60));

            // 获取第一个升级节点时间（P1是8小时，P2是24小时）
            var firstRuleHour = rule.levels[0].hours;
            
            // 只有超过第一个升级节点后才显示升级规则提醒
            if (elapsedHours < firstRuleHour) {
                console.log('未达到第一个升级节点（' + firstRuleHour + '小时），不显示升级规则提醒');
                return null;
            }

            // 构建升级规则显示内容
            var html = '<div style="margin-bottom: 10px; font-weight: bold; color: #333;">' + rule.name + ' - 已耗时 ' + elapsedHours + ' 小时</div>';
            html += '<table style="width: 100%; border-collapse: collapse; font-size: 13px;">';
            html += '<tr style="background-color: #f5f5f5;"><th style="padding: 8px; border: 1px solid #ddd; text-align: left; width: 80px;">时间</th><th style="padding: 8px; border: 1px solid #ddd; text-align: left;">触发动作</th><th style="padding: 8px; border: 1px solid #ddd; text-align: left; width: 100px;">负责人</th></tr>';

            var nextEscalation = null;
            var currentEscalation = null;

            for (var i = 0; i < rule.levels.length; i++) {
                var level = rule.levels[i];
                var isReached = elapsedHours >= level.hours;
                var isNext = !nextEscalation && !isReached;

                if (isReached) {
                    currentEscalation = level;
                }
                if (isNext) {
                    nextEscalation = level;
                }

                var rowStyle = isReached ? 'background-color: #ffebee;' : (isNext ? 'background-color: #fff3e0; font-weight: bold;' : '');
                var statusIcon = isReached ? '✓ ' : (isNext ? '⏳ ' : '○ ');
                var person = level.person || level.role;

                html += '<tr style="' + rowStyle + '">';
                html += '<td style="padding: 8px; border: 1px solid #ddd;">' + statusIcon + level.hours + '小时</td>';
                html += '<td style="padding: 8px; border: 1px solid #ddd;">' + level.action + '</td>';
                html += '<td style="padding: 8px; border: 1px solid #ddd;">' + person + '</td>';
                html += '</tr>';
            }

            html += '</table>';

            // 显示升级提示
            if (nextEscalation) {
                var remainingHours = nextEscalation.hours - elapsedHours;
                html += '<div style="margin-top: 10px; padding: 10px; background-color: #fff3e0; border-left: 4px solid #ff9800; color: #e65100;">';
                html += '<i class="layui-icon layui-icon-time"></i> <strong>即将升级：</strong>距离' + nextEscalation.role + '介入还有 <strong>' + remainingHours + '</strong> 小时';
                html += '</div>';
            } else if (currentEscalation) {
                html += '<div style="margin-top: 10px; padding: 10px; background-color: #ffebee; border-left: 4px solid #f44336; color: #c62828;">';
                html += '<i class="layui-icon layui-icon-urgent"></i> <strong>已升级至最高级别：</strong>' + currentEscalation.action;
                html += '</div>';
            }

            // 发送消息通知（模拟）
            sendEscalationNotification(normalizedPriority, elapsedHours, currentEscalation, nextEscalation);
            
            // 返回计算结果，供弹出框使用
            return {
                priority: normalizedPriority,
                elapsedHours: elapsedHours,
                currentEscalation: currentEscalation,
                nextEscalation: nextEscalation
            };
        }

        // 发送升级通知到消息中心
        function sendEscalationNotification(priority, elapsedHours, currentEscalation, nextEscalation) {
            var ticketId = TICKET_ID;
            var ticketTitle = TICKET_TITLE;
            
            console.log('准备发送升级通知:', {
                priority: priority,
                elapsedHours: elapsedHours,
                currentEscalation: currentEscalation,
                ticketId: ticketId,
                ticketTitle: ticketTitle
            });
            
            // 如果达到升级节点，发送消息通知
            if (currentEscalation && currentEscalation.person) {
                var notificationData = {
                    user_name: currentEscalation.person,
                    title: '工单升级提醒 - ' + escalationRules[priority].name,
                    content: '工单【' + ticketTitle + '】已达到' + currentEscalation.hours + '小时升级节点，需要' + currentEscalation.action,
                    type: 'warning',
                    ticket_id: ticketId
                };
                
                console.log('发送消息通知数据:', notificationData);
                
                // 调用后端API发送通知
                $.ajax({
                    url: '/api/notification/send',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(notificationData),
                    success: function(res) {
                        console.log('消息通知发送成功:', res);
                        // 显示成功提示
                        if (res.code === 200) {
                            console.log('消息已成功发送给:', currentEscalation.person);
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('消息通知发送失败:', error);
                        console.error('响应状态:', xhr.status);
                        console.error('响应内容:', xhr.responseText);
                    }
                });
            } else {
                console.log('未达到升级节点或没有负责人，不发送通知');
            }
        }

        // 显示升级规则弹出框
        function showEscalationAlert(priority, elapsedHours, currentEscalation, nextEscalation) {
            var rule = escalationRules[priority];
            if (!rule) return;
            
            // 构建弹出框内容
            var content = '<div style="padding: 20px;">';
            content += '<div style="margin-bottom: 15px; font-size: 16px; font-weight: bold; color: #FF5722;">';
            content += '<i class="layui-icon layui-icon-time"></i> ' + rule.name + ' - 已耗时 ' + elapsedHours + ' 小时';
            content += '</div>';
            
            // 升级规则表格
            content += '<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 15px;">';
            content += '<tr style="background-color: #f5f5f5;">';
            content += '<th style="padding: 10px; border: 1px solid #ddd; text-align: left; width: 80px;">时间</th>';
            content += '<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">触发动作</th>';
            content += '<th style="padding: 10px; border: 1px solid #ddd; text-align: left; width: 100px;">负责人</th>';
            content += '</tr>';
            
            for (var i = 0; i < rule.levels.length; i++) {
                var level = rule.levels[i];
                var isReached = elapsedHours >= level.hours;
                var isNext = !currentEscalation && !isReached && (!nextEscalation || nextEscalation.hours === level.hours);
                
                var bgColor = isReached ? '#ffebee' : (isNext ? '#fff3e0' : '');
                var icon = isReached ? '✓' : (isNext ? '⏳' : '○');
                var person = level.person || level.role;
                
                content += '<tr style="background-color: ' + bgColor + ';">';
                content += '<td style="padding: 10px; border: 1px solid #ddd;">' + icon + ' ' + level.hours + '小时</td>';
                content += '<td style="padding: 10px; border: 1px solid #ddd;">' + level.action + '</td>';
                content += '<td style="padding: 10px; border: 1px solid #ddd;">' + person + '</td>';
                content += '</tr>';
            }
            
            content += '</table>';
            
            // 升级提示
            if (nextEscalation) {
                var remainingHours = nextEscalation.hours - elapsedHours;
                content += '<div style="padding: 15px; background-color: #fff3e0; border-left: 4px solid #ff9800; color: #e65100; margin-top: 10px;">';
                content += '<i class="layui-icon layui-icon-time"></i> <strong>即将升级：</strong>距离' + nextEscalation.role + '介入还有 <strong>' + remainingHours + '</strong> 小时';
                content += '</div>';
            } else if (currentEscalation) {
                content += '<div style="padding: 15px; background-color: #ffebee; border-left: 4px solid #f44336; color: #c62828; margin-top: 10px;">';
                content += '<i class="layui-icon layui-icon-urgent"></i> <strong>已升级至最高级别：</strong>' + currentEscalation.action;
                content += '</div>';
            }
            
            content += '</div>';
            
            // 显示弹出框
            layer.open({
                type: 1,
                title: ['升级规则提醒', 'font-size: 18px; font-weight: bold; color: #FF5722;'],
                area: ['700px', 'auto'],
                content: content,
                btn: ['知道了'],
                btnAlign: 'c',
                shade: 0.3,
                anim: 2
            });
        }

        // 页面加载完成后计算升级规则并显示弹出框
        // 升级规则提醒弹框已禁用，只在消息中心显示通知
        // $(document).ready(function() {
        //     var result = calculateEscalation();
        //     
        //     // 如果有升级规则，显示弹出框
        //     if (result && result.priority) {
        //         showEscalationAlert(result.priority, result.elapsedHours, result.currentEscalation, result.nextEscalation);
        //     }
        // });

        // 序列号输入提示（已禁用验证）
        $('input[name="serial_number"]').on('blur', function(){
            var serial = $(this).val();
            
            // 上下文提示
            if (serial === '') {
                 layer.tips('请输入设备序列号，通常位于设备底部或背部的条形码标签上。', this, {tips: 1});
            }
        });
        
        // 检查保修状态函数（已禁用）
        function checkWarranty(serial) {
            // 已禁用保修状态检查
            console.log('保修状态检查已禁用');
        }
        
        // 监听完成时间变更，检查与接单时间的差值
        $('#completion_time_picker').on('change', function() {
            var orderTime = $('#order_time_picker').val();
            var completionTime = $(this).val();
            
            if(orderTime && completionTime) {
                var orderDate = new Date(orderTime.replace(/-/g, '/'));
                var completionDate = new Date(completionTime.replace(/-/g, '/'));
                var diffHours = (completionDate - orderDate) / (1000 * 60 * 60);
                
                if(diffHours < 0) {
                    $('#completion_time_warning').text('完成时间不能早于接单时间');
                } else if(diffHours > 72) {
                    $('#completion_time_warning').text('警告：处理时间超过72小时');
                } else {
                    $('#completion_time_warning').text('');
                }
            }
        });

        // 处理粘贴图片功能
        $('textarea[name="description"], textarea[name="relatedinfo"], textarea[name="solution"]').on('paste', function(e) {
            var clipboardData = e.originalEvent.clipboardData;
            var items = clipboardData.items;
            var blob = null;
            
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    blob = items[i].getAsFile();
                    break;
                }
            }
            
            if (blob) {
                // 阻止默认粘贴行为，防止文件名被粘贴到文本框
                e.preventDefault();
                
                var formData = new FormData();
                formData.append('file', blob);
                
                // 显示上传中提示
                var loadIndex = layer.load(1, {
                    shade: [0.1, '#fff']
                });
                
                // 上传图片
                $.ajax({
                    url: basePath + 'system/upload/image',
                    type: 'POST',
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function(res) {
                        layer.close(loadIndex);
                        if (res.success) {
                            // 添加图片到容器
                            var imgUrl = res.data.url;
                            var photoId = res.data.photo_id;
                            // 存储图片URL和ID
                            imageUrls.push({url: imgUrl, id: photoId});
                            
                            // 使用新的图片获取接口
                            var displayUrl = basePath + 'system/upload/image/' + photoId;
                            var targetTextareaName = $(e.target).attr('name');
                            // 确保ID的格式与HTML中定义的一致，将下划线替换为连字符
                            var targetImageContainerId = targetTextareaName.replace('_', '-') + '-image-container';
                            
                            $('#' + targetImageContainerId).append(
                                '<div class="pasted-image" style="display:inline-block; position:relative; margin:5px;">' +
                                '<img src="' + displayUrl + '" style="max-width:200px; max-height:200px; border:1px solid #ddd; padding:3px;">' +
                                '<span class="delete-image" data-url="' + imgUrl + '" data-id="' + photoId + '" style="position:absolute; top:0; right:0; background:rgba(0,0,0,0.5); color:#fff; cursor:pointer; padding:2px 5px;">×</span>' +
                                '</div>'
                            );
                            
                            // 更新对应文本域的隐藏图片引用字段
                            var targetTextareaName = $(e.target).attr('name');
                            var hiddenImageReferencesId = 'hidden_image_references_' + targetTextareaName;
                            // 如果对应的隐藏字段不存在，则动态创建它
                            if ($('#' + hiddenImageReferencesId).length === 0) {
                                $(e.target).after('<textarea id="' + hiddenImageReferencesId + '" name="image_references_str_' + targetTextareaName + '" style="display:none;"></textarea>');
                            }
                            var imgMark = '![图片](' + imgUrl + '#id=' + photoId + ')';
                            $('#' + hiddenImageReferencesId).val($('#' + hiddenImageReferencesId).val() + imgMark + '\n@@IMAGE_SEPARATOR@@\n');
                        } else {
                            layer.msg('图片上传失败: ' + res.msg, {icon: 2});
                        }
                    },
                    error: function() {
                        layer.close(loadIndex);
                        layer.msg('图片上传失败', {icon: 2});
                    }
                });
            }
        });
        
        // 这段上传图片逻辑目前只针对description，如果需要通用，也需要修改
        // 上传图片
        $('#upload-image').on('change', function() {
            var formData = new FormData();
            formData.append('file', this.files[0]);
            
            $.ajax({
                url: basePath + 'system/upload/image',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(res) {
                    if (res.success) {
                        var imgUrl = res.url;
                        var photoId = res.photo_id;
                        
                        // 存储图片URL和ID
                        imageUrls.push({url: imgUrl, id: photoId});
                        
                        // 使用新的图片获取接口
                        var displayUrl = basePath + 'system/upload/image/' + photoId;
                        
                        // 添加图片到容器
                        $('#image-container').append(
                            '<div class="pasted-image" style="display:inline-block; position:relative; margin:5px;">' +
                            '<img src="' + displayUrl + '" style="max-width:200px; max-height:200px; border:1px solid #ddd; padding:3px;">' +
                            '<span class="delete-image" data-url="' + imgUrl + '" data-id="' + photoId + '" style="position:absolute; top:0; right:0; background:rgba(0,0,0,0.5); color:#fff; cursor:pointer; padding:2px 5px;">×</span>' +
                            '</div>'
                        );
                        
                        // 这段逻辑也需要根据当前激活的文本域来决定图片引用存储到哪里
                        // 暂时保持原样，因为上传按钮没有明确的上下文
                        // 如果需要支持所有文本域通过按钮上传，需要更复杂的逻辑来确定目标
                        var textarea = $('textarea[name="description"]');
                        // textarea.val(textarea.val() + '![图片](' + imgUrl + '#id=' + photoId + ')'); // Removed this line
                        // Store in hidden field instead
                        $('#hidden_image_references').val($('#hidden_image_references').val() + '![图片](' + imgUrl + '#id=' + photoId + ')' + '\n@@IMAGE_SEPARATOR@@\n');
                        
                        // 清空文件输入框
                        $('#upload-image').val('');
                    } else {
                        layer.msg('上传失败：' + res.msg);
                    }
                },
                error: function() {
                    layer.msg('上传失败，请重试');
                }
            });
        });
        
        // 删除图片
        $(document).on('click', '.delete-image', function() {
            var $this = $(this);
            var $pastedImageDiv = $this.closest('.pasted-image');
            var $imageContainer = $pastedImageDiv.parent();
            var containerId = $imageContainer.attr('id');
            var targetTextareaName = '';
            if (containerId && containerId.endsWith('-image-container')) {
                targetTextareaName = containerId.replace('-image-container', '');
            }
            var url = $(this).data('url');
            var photoId = $(this).data('id');
            var imgElement = $(this).parent();
            
            // 从DOM中移除图片
            imgElement.remove();
            
            // 从对应的隐藏图片引用字段中移除图片标记
            if (targetTextareaName) {
                var hiddenImageReferencesId = 'hidden_image_references_' + targetTextareaName;
                var hiddenText = $('#' + hiddenImageReferencesId).val();
                if (hiddenText) {
                    $('#' + hiddenImageReferencesId).val(hiddenText.replace('![图片](' + url + '#id=' + photoId + ')' + '\n@@IMAGE_SEPARATOR@@\n', ''));
                }
            } else {
                // Fallback for old structure or if targetTextareaName couldn't be determined
                var hiddenText = $('#hidden_image_references').val(); // Original hidden field for description
                 if (hiddenText) {
                    $('#hidden_image_references').val(hiddenText.replace('![图片](' + url + '#id=' + photoId + ')' + '\n@@IMAGE_SEPARATOR@@\n', ''));
                }
            }
            
            // 从图片URL数组中移除
            var index = -1;
            for (var i = 0; i < imageUrls.length; i++) {
                if (imageUrls[i].id === photoId) {
                    index = i;
                    break;
                }
            }
            if (index > -1) {
                imageUrls.splice(index, 1);
            }
        });
        
        // 清理文本域中的图片标记
        function cleanTextareaContent(textareaName) {
            var textarea = $('textarea[name="' + textareaName + '"]');
            var content = textarea.val();
            
            // 使用正则表达式移除图片标记 ![图片](url#id=photoId)
            var cleanedContent = content.replace(/!\[图片\]\([^)]+\)/g, '');
            
            // 更新文本域内容
            textarea.val(cleanedContent);
        }

        // 页面加载时解析各个文本域的图片并显示
        $(function() {
            function loadImagesForTextarea(textareaName) {
                var hiddenImageReferencesId = 'hidden_image_references_' + textareaName;
                var imageContainerId = textareaName + '-image-container';
                var imageReferencesStr = $('#' + hiddenImageReferencesId).val();
                
                // Fallback for description (original field)
                if (!imageReferencesStr && textareaName === 'description') { 
                    imageReferencesStr = $('#hidden_image_references').val();
                }
                // Fallback for relatedinfo and solution fields
                if (!imageReferencesStr && (textareaName === 'relatedinfo' || textareaName === 'solution')) { 
                    imageReferencesStr = $('#hidden_image_references').val();
                }

                if (imageReferencesStr) {
                    var imageMarks = imageReferencesStr.split('\n@@IMAGE_SEPARATOR@@\n');
                    imageMarks.forEach(function(imgMarkWithNewline) {
                        var imgMark = imgMarkWithNewline.trim();
                        if (imgMark) {
                            var match = /!\[图片\]\(([^\)]+)\)/.exec(imgMark);
                            if (match) {
                                var imgUrlWithId = match[1];
                                var parts = imgUrlWithId.split('#id=');
                                var imgUrl = parts[0];
                                var photoId = parts.length > 1 ? parts[1] : null;
                                var displayUrl = photoId ? basePath + 'system/upload/image/' + photoId : imgUrl;
                                
                                if (typeof imageUrls === 'undefined') { 
                                    imageUrls = []; 
                                }
                                imageUrls.push({url: imgUrl, id: photoId});
                                
                                $('#' + imageContainerId).append(
                                    '<div class="pasted-image" style="display:inline-block; position:relative; margin:5px;">' +
                                    '<img src="' + displayUrl + '" style="max-width:200px; max-height:200px; border:1px solid #ddd; padding:3px; cursor:pointer;">' +
                                    '<span class="delete-image" data-url="' + imgUrl + '" data-id="' + photoId + '" style="position:absolute; top:0; right:0; background:rgba(0,0,0,0.5); color:#fff; cursor:pointer; padding:2px 5px;">×</span>' +
                                    '</div>'
                                );
                            }
                        }
                    });
                }
            }

            loadImagesForTextarea('description');
            loadImagesForTextarea('relatedinfo');
            loadImagesForTextarea('solution');
            
            // 清理文本域中的图片路径标记
            cleanTextareaContent('description');
            cleanTextareaContent('relatedinfo');
            cleanTextareaContent('solution');
            
            // 检查工单是否超时并显示提醒
            console.log('页面加载完成，准备检查工单超时状态...');
            // 确保页面完全加载后再检查
            setTimeout(function() {
                console.log('开始执行超时检查...');
                var timeoutInfo = checkTicketTimeout();
                console.log('超时检查结果:', timeoutInfo);
                
                // 更新页面顶部的超时状态显示
                if (timeoutInfo && timeoutInfo.isTimeout) {
                    $('#timeout-status').text('已超时').css('color', '#FF5722');
                    $('#timeout-duration').text(timeoutInfo.hours + '小时');
                } else {
                    $('#timeout-status').text('正常').css('color', '#5FB878');
                    $('#timeout-duration').text('');
                }
                
                // // 测试代码：强制显示超时横幅 - 根据用户请求构造一个超时的工单
                // console.log('测试：强制显示超时横幅');
                // var testTimeoutInfo = {
                //     isTimeout: true,
                //     hours: 12,
                //     priority: $('select[name="priority"]').val() || 'High', // 使用当前选择的优先级
                //     timeoutDate: formatDateTime(new Date(new Date().getTime() - 12 * 60 * 60 * 1000)) // 12小时前
                // };
                // console.log('构造的超时工单信息:', testTimeoutInfo);
                // timeoutInfo = testTimeoutInfo; // 这行被注释掉以禁用测试代码
                
                if (timeoutInfo && timeoutInfo.isTimeout) {
                    // 根据优先级设置不同的提示样式
                    var iconType = 0; // 默认
                    var titleColor = '#FF5722'; // 默认红色
                    var timeoutClass = 'timeout-alert';
                    
                    switch(timeoutInfo.priority) {
                        case 'Critical':
                            iconType = 2; // 叹号
                            titleColor = '#FF0000'; // 紧急红
                            timeoutClass += ' timeout-alert-critical';
                            break;
                        case 'High':
                            iconType = 0; // 叹号
                            titleColor = '#FF5722'; // 高风险红
                            timeoutClass += ' timeout-alert-high';
                            break;
                        case 'Medium':
                            iconType = 0; // 感叹号
                            titleColor = '#FFB800'; // 中风险黄
                            timeoutClass += ' timeout-alert-medium';
                            break;
                        case 'Low':
                            iconType = 8; // 提示
                            titleColor = '#1E9FFF'; // 低风险蓝
                            timeoutClass += ' timeout-alert-low';
                            break;
                    }
                    
                }
            }, 1000); // 延迟1秒检查，确保页面完全加载
        });

        // Image click to zoom in #image-container (event delegation for dynamically added images)
        $('#image-container').on('click', 'img', function() {
            layer.photos({
                photos: {
                    "title": "查看图片",
                    "id": "edit-preview-album", // A unique ID for this photo album
                    "start": 0, 
                    "data": [
                        {
                            "alt": $(this).attr('alt') || "图片预览",
                            "pid": $(this).attr('src'), 
                            "src": $(this).attr('src'), 
                            "thumb": ""
                        }
                    ]
                },
                anim: 5 
            });
        });

        // 图片点击放大功能
        $(document).on('click', '#relatedinfo-image-container img, #solution-image-container img, #description-image-container img', function() {
            var imgUrl = $(this).attr('src');
            // 使用Layui的layer组件创建图片预览弹窗
            layer.open({
                type: 1,
                title: false,
                closeBtn: 0,
                area: ['auto', 'auto'],
                skin: 'layui-layer-nobg',
                shadeClose: true,
                content: '<img src="' + imgUrl + '" style="max-width:90%; max-height:90vh; margin:0 auto; display:block;">' 
            });
        });

        // 初始化页面时自动加载流程记录
        $(document).ready(function() {
            // 自动加载流程记录
            loadTicketFlow();
        });
        
        // 根据优先级获取颜色
        function getPriorityColor(priority) {
            switch(priority) {
                case 'P1':
                    return '#FF5722'; // 红色
                case 'P2':
                    return '#FFB800'; // 橙色
                case 'P3':
                    return '#1E9FFF'; // 蓝色
                case 'P4':
                    return '#009688'; // 绿色
                default:
                    return '#666666'; // 灰色
            }
        }
        
        // 监听全局的加载流程事件（使用原生事件）
        document.addEventListener('loadTicketFlow', function() {
            loadTicketFlow();
        });
        
        // 查看流程按钮点击事件
        $('#view-flow-btn').on('click', function() {
            console.log('view-flow-btn clicked');
            // 加载流程记录
            loadTicketFlow();
            
            // 滚动到流程记录区域
            var flowContainer = $('.wide-flow-section');
            if (flowContainer.length > 0) {
                // 添加高亮效果
                flowContainer.css('background-color', '#e6f7ff');
                flowContainer.css('transition', 'background-color 0.3s ease');
                
                // 滚动到流程记录区域
                $('html, body').animate({
                    scrollTop: flowContainer.offset().top - 100
                }, 500);
                
                // 3秒后移除高亮效果
                setTimeout(function() {
                    flowContainer.css('background-color', '');
                }, 3000);
            }
        });

        // 加载工单流程记录
        function loadTicketFlow() {
            var ticketId = $('input[name="id"]').val();
            if (!ticketId) {
                layer.msg('无法获取工单ID', {icon: 2});
                return;
            }

            // 显示加载中状态
            $('#flow-timeline').html('<div class="flow-loading"><i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop"></i> 正在加载流程记录...</div>');

            // 请求流程数据
            $.ajax({
                url: basePath + 'system/ticket/flow/' + ticketId,
                type: 'GET',
                dataType: 'json',
                success: function(res) {
                    if (res.code === 200) {
                        // 后端返回的数据结构是 {code: 200, data: {flows: [...], statistics: {...}}}
                        renderTicketFlow(res.data);
                    } else {
                        $('#flow-timeline').html('<div class="flow-empty">加载失败: ' + (res.msg || '未知错误') + '</div>');
                    }
                },
                error: function(xhr) {
                    var errorMsg = '请求失败';
                    
                    // 检查是否是重定向到登录页面
                    if (xhr.status === 302 || xhr.status === 0) {
                        errorMsg = '会话已过期，请重新登录';
                    } else if (xhr.status === 401) {
                        errorMsg = '未授权访问，请登录';
                    } else if (xhr.status === 403) {
                        errorMsg = '权限不足，无法访问';
                    } else if (xhr.status === 404) {
                        errorMsg = 'API端点不存在';
                    } else if (xhr.status === 500) {
                        errorMsg = '服务器内部错误';
                    } else if (xhr.responseJSON && xhr.responseJSON.msg) {
                        errorMsg = xhr.responseJSON.msg;
                    } else if (xhr.statusText) {
                        errorMsg = '请求失败: ' + xhr.statusText;
                    }
                    
                    // 添加调试信息
                    console.error('API请求失败:', {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                        url: this.url
                    });
                    
                    $('#flow-timeline').html('<div class="flow-empty">加载失败: ' + errorMsg + '</div>');
                }
            });
        }

        // 渲染工单流程记录
        function renderTicketFlow(data) {
            // 缓存数据供点击使用
            flowDataCache = data;
            var html = '';
            
            // 如果有统计数据，先显示统计
            if (data.statistics) {
                // 计算总耗时
                var totalHours = 0;
                var deptTime = {};
                var overdueCount = 0;
                // 彻底修复阶段累计超时统计
                var completeFixTotalHours = 0;
                var completeFixDeptTime = {};
                // 业务恢复阶段累计超时统计
                var businessRecoveryTotalHours = 0;
                var businessRecoveryDeptTime = {};
                
                if (data.flows && data.flows.length > 0) {
                    var firstFlow = data.flows[0];
                    var lastFlow = data.flows[data.flows.length - 1];
                    if (firstFlow.create_time && lastFlow.create_time) {
                        var startTime = new Date(firstFlow.create_time);
                        var endTime = new Date(lastFlow.create_time);
                        totalHours = (endTime - startTime) / (1000 * 60 * 60);
                    }
                    
                    // 统计各部门耗时和超时次数
                    data.flows.forEach(function(flow) {
                        if (flow.is_overdue) {
                            overdueCount++;
                        }
                        if (flow.responsible_department && flow.overdue_hours > 0) {
                            if (!deptTime[flow.responsible_department]) {
                                deptTime[flow.responsible_department] = 0;
                            }
                            deptTime[flow.responsible_department] += flow.overdue_hours;
                        }
                        // 统计彻底修复阶段累计超时
                        if (flow.cumulative_overdue && flow.cumulative_overdue.complete_fix_department_overdue) {
                            var cfDeptOverdue = flow.cumulative_overdue.complete_fix_department_overdue;
                            for (var cfDept in cfDeptOverdue) {
                                var cfHours = cfDeptOverdue[cfDept];
                                if (cfHours > 0.05) {
                                    completeFixTotalHours += cfHours;
                                    if (!completeFixDeptTime[cfDept]) {
                                        completeFixDeptTime[cfDept] = 0;
                                    }
                                    completeFixDeptTime[cfDept] += cfHours;
                                }
                            }
                        }
                        // 统计业务恢复阶段累计超时
                        if (flow.cumulative_overdue && flow.cumulative_overdue.business_recovery_department_overdue) {
                            var brDeptOverdue = flow.cumulative_overdue.business_recovery_department_overdue;
                            for (var brDept in brDeptOverdue) {
                                var brHours = brDeptOverdue[brDept];
                                if (brHours > 0.05) {
                                    businessRecoveryTotalHours += brHours;
                                    if (!businessRecoveryDeptTime[brDept]) {
                                        businessRecoveryDeptTime[brDept] = 0;
                                    }
                                    businessRecoveryDeptTime[brDept] += brHours;
                                }
                            }
                        }
                    });
                }
                
                var totalSteps = data.statistics.total_steps || 0;
                var completedSteps = data.statistics.is_completed ? totalSteps : Math.max(0, totalSteps - 1);
                var progressPercent = totalSteps > 0 ? (completedSteps / totalSteps * 100) : 0;
                
                // 格式化耗时显示 - 精确到小时和分钟
                var timeDisplay = '';
                if (totalHours < 1) {
                    var minutes = Math.round(totalHours * 60);
                    timeDisplay = minutes + '分钟';
                } else if (totalHours < 24) {
                    var hours = Math.floor(totalHours);
                    var minutes = Math.round((totalHours - hours) * 60);
                    timeDisplay = hours + '小时' + (minutes > 0 ? minutes + '分钟' : '');
                } else {
                    var days = Math.floor(totalHours / 24);
                    var remainingHours = Math.floor(totalHours % 24);
                    var minutes = Math.round(((totalHours % 24) - remainingHours) * 60);
                    timeDisplay = days + '天' + (remainingHours > 0 ? remainingHours + '小时' : '') + (minutes > 0 ? minutes + '分钟' : '');
                }
                
                html += '<div class="flow-summary">';
                html += '<div class="flow-summary-title">工单进度</div>';
                
                // 进度条
                html += '<div class="flow-progress-bar">';
                html += '<div class="flow-progress-fill" style="width: ' + progressPercent + '%;"></div>';
                html += '<div class="flow-progress-text">' + completedSteps + '/' + totalSteps + ' 步骤</div>';
                html += '</div>';
                
                // 关键指标
                html += '<div class="flow-summary-stats">';
                html += '<div class="flow-stat-item flow-stat-highlight">';
                html += '<span class="flow-stat-label">状态</span>';
                html += '<span class="flow-stat-value ' + (data.statistics.is_completed ? 'status-completed' : 'status-progress') + '">';
                html += (data.statistics.is_completed ? '✓ 已完成' : '● 进行中') + '</span>';
                html += '</div>';
                
                html += '<div class="flow-stat-item">';
                html += '<span class="flow-stat-label">总耗时</span>';
                html += '<span class="flow-stat-value">' + timeDisplay + '</span>';
                html += '</div>';
                
                // 各部门耗时
                for (var dept in deptTime) {
                    if (deptTime[dept] > 0.05) {
                        html += '<div class="flow-stat-item flow-stat-warning">';
                        html += '<span class="flow-stat-label">' + dept + '</span>';
                        html += '<span class="flow-stat-value">超时 ' + deptTime[dept].toFixed(1) + 'h</span>';
                        html += '</div>';
                    }
                }
                
                // 超时预警
                if (overdueCount > 0) {
                    html += '<div class="flow-stat-item flow-stat-danger" onclick="filterOverdueFlows()" style="cursor: pointer;" title="点击查看超时节点">';
                    html += '<span class="flow-stat-label">⚠ 超时预警</span>';
                    html += '<span class="flow-stat-value">' + overdueCount + ' 次</span>';
                    html += '</div>';
                }
                
                html += '</div>';
                
                // 业务恢复阶段累计超时 - 黄色卡片格式，宽度约33%，左对齐
                if (businessRecoveryTotalHours > 0) {
                    html += '<div class="flow-overdue-summary" style="margin-top: 10px; width: 33%;">';
                    html += '<div class="flow-overdue-summary-title">';
                    html += '<i class="layui-icon layui-icon-time"></i> 业务恢复阶段累计超时';
                    html += '<span class="flow-overdue-total">' + businessRecoveryTotalHours.toFixed(1) + '小时</span>';
                    html += '</div>';
                    html += '<div class="flow-overdue-summary-details">';
                    
                    for (var brDept in businessRecoveryDeptTime) {
                        if (businessRecoveryDeptTime[brDept] > 0.05) {
                            html += '<span class="dept-overdue-tag">' + brDept + ' ' + businessRecoveryDeptTime[brDept].toFixed(1) + 'h</span>';
                        }
                    }
                    
                    html += '</div>';
                    html += '</div>';
                }
                
                // 彻底修复阶段累计超时 - 黄色卡片格式，宽度约33%，左对齐
                if (completeFixTotalHours > 0) {
                    html += '<div class="flow-overdue-summary" style="margin-top: 10px; width: 33%;">';
                    html += '<div class="flow-overdue-summary-title">';
                    html += '<i class="layui-icon layui-icon-time"></i> 彻底修复阶段累计超时';
                    html += '<span class="flow-overdue-total">' + completeFixTotalHours.toFixed(1) + '小时</span>';
                    html += '</div>';
                    html += '<div class="flow-overdue-summary-details">';
                    
                    for (var cfDept in completeFixDeptTime) {
                        if (completeFixDeptTime[cfDept] > 0.05) {
                            html += '<span class="dept-overdue-tag">' + cfDept + ' ' + completeFixDeptTime[cfDept].toFixed(1) + 'h</span>';
                        }
                    }
                    
                    html += '</div>';
                    html += '</div>';
                }
                
                html += '</div>';
            }
            
            // 渲染流程步骤 - 使用容器实现横向排列
            if (data.flows && data.flows.length > 0) {
                html += '<div class="flow-items-container">';
                data.flows.forEach(function(flow, index) {
                    // 添加状态标签
                    var statusClass = 'pending';
                    var statusText = '处理中';
                    
                    // 如果有处理模式，用处理模式替换"处理中"
                    if (flow.flow_mode && flow.flow_mode !== '工单创建') {
                        statusText = flow.flow_mode;
                        // 根据处理模式设置颜色
                        if (flow.flow_mode.indexOf('临时') !== -1 || flow.flow_mode.indexOf('规避') !== -1) {
                            statusClass = 'temporary';
                        } else if (flow.to_status === '已关闭' || flow.flow_mode.indexOf('解决') !== -1) {
                            statusClass = 'completed';
                        }
                    } else if (flow.is_temporary_solution) {
                        statusClass = 'temporary';
                        statusText = '临时方案';
                    } else if (flow.to_status === '已关闭') {
                        statusClass = 'completed';
                        statusText = '已完成';
                    }
                    
                    // 获取优先级颜色
                    var priorityColor = '';
                    if (flow.priority === 'P1') priorityColor = '#f44336';
                    else if (flow.priority === 'P2') priorityColor = '#FF9800';
                    else if (flow.priority === 'P3') priorityColor = '#2196F3';
                    else priorityColor = '#9E9E9E';
                    
                    html += '<div class="flow-item ' + statusClass + '" onclick="showFlowDetail(' + index + ')" style="cursor: pointer;">';
                    html += '<div class="flow-content">';
                    
                    // 顶部标签栏：类型 + 优先级
                    html += '<div class="flow-card-header">';
                    html += '<span class="flow-type-tag">' + (flow.flow_type || '远程') + '</span>';
                    if (flow.priority) {
                        html += '<span class="flow-priority-tag" style="background-color: ' + priorityColor + ';">' + flow.priority + '</span>';
                    }
                    html += '</div>';
                    
                    // 第一行：时间 + 处理人 + 部门
                    html += '<div class="flow-info-row flow-info-primary">';
                    html += '<span class="flow-info-time"><i class="layui-icon layui-icon-time"></i> ' + (flow.create_time || '') + '</span>';
                    if (flow.handler) {
                        html += '<span class="flow-info-handler"><i class="layui-icon layui-icon-username"></i> ' + flow.handler + '</span>';
                    }
                    if (flow.department) {
                        html += '<span class="flow-info-dept"><i class="layui-icon layui-icon-home"></i> ' + flow.department + '</span>';
                    }
                    html += '</div>';
                    
                    // 第二行：状态变更
                    if (flow.from_status && flow.to_status) {
                        html += '<div class="flow-info-row">';
                        html += '<span class="flow-info-status-change">';
                        html += '<span class="status-label">状态变更:</span>';
                        html += '<span class="status-from">' + flow.from_status + '</span>';
                        html += '<span class="status-arrow">→</span>';
                        html += '<span class="status-to">' + flow.to_status + '</span>';
                        html += '</span>';
                        html += '</div>';
                    }
                    
                    // 从 notes 中提取问题分类变更信息
                    var categoryFrom = null;
                    var categoryTo = null;
                    if (flow.notes) {
                        var categoryMatch = flow.notes.match(/问题分类变更:\s*(.+?)(?:\n|$)/);
                        if (categoryMatch) {
                            var categoryText = categoryMatch[1].trim();
                            // 去掉主分类标签
                            categoryText = categoryText.replace(/主分类:\s*/g, '');
                            // 解析箭头分隔的分类
                            var arrowMatch = categoryText.match(/(.+?)\s*→\s*(.+)/);
                            if (arrowMatch) {
                                categoryFrom = arrowMatch[1].trim();
                                categoryTo = arrowMatch[2].trim();
                            } else {
                                categoryTo = categoryText;
                            }
                        }
                    }
                    
                    // 第四行：问题分类变更（如果有）
                    if (categoryTo) {
                        html += '<div class="flow-info-row">';
                        html += '<span class="flow-info-category-change">';
                        html += '<span class="category-label">问题分类变更:</span>';
                        if (categoryFrom) {
                            html += '<span class="category-from">' + categoryFrom + '</span>';
                            html += '<span class="category-arrow">→</span>';
                        }
                        html += '<span class="category-to">' + categoryTo + '</span>';
                        html += '</span>';
                        html += '</div>';
                    }
                    
                    // 移除描述行显示
                    // if (flow.description && flow.description !== '工单创建') {
                    //     html += '<div class="flow-details">描述: ' + flow.description + '</div>';
                    // }
                    
                    if (flow.notes) {
                        // 处理记录显示 - 支持长文本展开/折叠
                        var notesText = flow.notes;
                        
                        // 移除问题分类变更行（已单独显示）
                        notesText = notesText.replace(/问题分类变更:.+?(?:\n|$)/g, '');
                        
                        // 对标签进行加粗处理
                        notesText = notesText.replace(/处理记录:/g, '<strong>处理记录:</strong>');
                        notesText = notesText.replace(/处置方案:/g, '<strong>处置方案:</strong>');
                        notesText = notesText.replace(/次分类:/g, '<strong>次分类:</strong>');
                        // 去掉主分类标签
                        notesText = notesText.replace(/主分类:/g, '');
                        
                        var isLongText = notesText.length > 150 || notesText.split('\n').length > 3;
                        
                        if (isLongText) {
                            // 长文本：显示预览 + 展开/折叠按钮
                            var previewText = notesText.substring(0, 150);
                            if (previewText.lastIndexOf('\n') > 100) {
                                previewText = notesText.substring(0, notesText.indexOf('\n', 100));
                            }
                            if (previewText.length < notesText.length) {
                                previewText += '...';
                            }
                            
                            html += '<div class="flow-notes-container" id="notes-' + index + '">';
                            html += '<div class="flow-notes-preview">' + previewText.replace(/\n/g, '<br>') + '</div>';
                            html += '<div class="flow-notes-full" style="display:none;">' + notesText.replace(/\n/g, '<br>') + '</div>';
                            html += '<a class="flow-notes-toggle" onclick="toggleNotes(' + index + ')" data-expanded="false">';
                            html += '<i class="layui-icon layui-icon-down"></i> 展开全部</a>';
                            html += '</div>';
                        } else {
                            // 短文本：直接显示
                            html += '<div class="flow-details flow-notes">' + notesText.replace(/\n/g, '<br>') + '</div>';
                        }
                    }
                    
                    // 添加超时信息显示 - 底部红色警告（只显示超时时间大于0的）
                    if (flow.is_overdue && flow.overdue_hours > 0.05) {
                        html += '<div class="flow-overdue-alert">';
                        html += '<div class="flow-overdue-icon"><i class="layui-icon layui-icon-time"></i></div>';
                        html += '<div class="flow-overdue-content">';
                        html += '<div class="flow-overdue-title">超时预警</div>';
                        html += '<div class="flow-overdue-desc">' + (flow.responsible_department || '未知部门') + ' · ' + (flow.overdue_stage || '业务恢复阶段') + ' · ' + flow.overdue_hours.toFixed(1) + '小时</div>';
                        html += '</div>';
                        html += '</div>';
                    }
                    
                    // 为每个流程节点添加累计超时信息（已移除，改为在汇总区域统一显示）
                    
                    html += '<div class="flow-status ' + statusClass + '">' + statusText + '</div>';
                    html += '</div>';
                    html += '</div>';
                });
                // 添加滚动提示
                html += '<div class="flow-scroll-hint"><span><i class="layui-icon layui-icon-left"></i> 左右滑动查看更多 <i class="layui-icon layui-icon-right"></i></span></div>';
                html += '</div>';
            } else {
                html += '<div class="flow-empty">暂无流程记录</div>';
            }
            
            $('#flow-timeline').html(html);
        }
        
        // 筛选超时节点
        window.filterOverdueFlows = function() {
            if (!flowDataCache || !flowDataCache.flows) return;
            
            var overdueFlows = flowDataCache.flows.filter(function(flow) {
                return flow.is_overdue;
            });
            
            if (overdueFlows.length === 0) {
                layer.msg('没有超时节点', {icon: 0});
                return;
            }
            
            // 重新渲染只显示超时节点
            var filteredData = {
                flows: overdueFlows,
                statistics: flowDataCache.statistics
            };
            renderTicketFlow(filteredData);
            
            // 显示提示
            layer.msg('已筛选出 ' + overdueFlows.length + ' 个超时节点', {icon: 1});
            
            // 添加重置按钮
            $('#flow-timeline').prepend('<div style="text-align: center; margin-bottom: 10px;"><button class="layui-btn layui-btn-normal" onclick="resetFlowFilter()"><i class="layui-icon layui-icon-refresh"></i> 显示全部节点</button></div>');
        };
        
        // 重置筛选
        window.resetFlowFilter = function() {
            if (flowDataCache) {
                renderTicketFlow(flowDataCache);
            }
        };

        // 监听提交
        form.on('submit(saveConfigBtn)', function (data) {
            // 防止重复提交，首先禁用按钮
            var submitBtn = $(this).find('button[type="submit"]');
            submitBtn.attr('disabled', true).addClass('layui-btn-disabled');
            
            console.log('提交表单。当前隐藏id值:', $('input[name="id"]').val());
            var formData = data.field;
            
            // 确保ID字段存在
            if (!formData.id) {
                layer.msg('工单ID缺失，请确保正确加载工单数据', {icon: 2, time: 2500});
                // 重新启用按钮
                submitBtn.attr('disabled', false).removeClass('layui-btn-disabled');
                return false;
            }

            // 转换日期格式
            if(formData.appointment_time) {
                formData.appointment_time = formData.appointment_time.replace('T', ' ');
            }
            if(formData.order_time) {
                formData.order_time = formData.order_time.replace('T', ' ');
            }
            if(formData.completion_time) {
                formData.completion_time = formData.completion_time.replace('T', ' ');
            }
            
            // 显示加载中提示
            var loadingIndex = layer.load(1, {
                shade: [0.1, '#fff']
            });

            $.ajax({
                url: basePath + 'system/ticket/update',
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function (res) {
                    layer.close(loadingIndex);
                    // 重新启用按钮
                    submitBtn.attr('disabled', false).removeClass('layui-btn-disabled');
                    if (res.success) {
                        layer.msg(res.msg || '保存成功', {icon: 1, time: 1000}, function() {
                            parent.layer.closeAll(); // 确保关闭所有弹窗
                            parent.layui.table.reload('dataTable');
                            // 移除loadTicketFlow()调用，避免重复加载流程
                            // 页面加载时已经调用了loadTicketFlow()，不需要重复调用
                            
                            // 可选：显示状态变更成功的提示信息
                            var statusChangeMsg = '';
                            if (formData.status) {
                                statusChangeMsg = '工单状态已更新为：' + formData.status;
                                layer.msg(statusChangeMsg, {icon: 1, time: 2000});
                            }
                        });
                    } else {
                        layer.msg(res.msg || '保存失败', {icon: 2, time: 1500});
                    }
                },
                error: function (xhr) {
                    layer.close(loadingIndex);
                    // 重新启用按钮
                    submitBtn.attr('disabled', false).removeClass('layui-btn-disabled');
                    var errorMsg = xhr.responseJSON && xhr.responseJSON.msg 
                        ? xhr.responseJSON.msg 
                        : '请求失败: ' + (xhr.statusText || '未知错误');
                    layer.msg(errorMsg, {icon: 2, time: 2000});
                    console.error('保存失败:', xhr);
                }
            });
            return false;
        });
        
        // 关闭对话框函数
        window.closeDialog = function() {
            console.log('closeDialog called');
            parent.layer.close(parent.layer.getFrameIndex(window.name));
        };
    });
