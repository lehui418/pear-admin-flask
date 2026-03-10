layui.define(['table', 'jquery', 'element', 'dropdown'], function (exports) {
    "use strict";

    var MOD_NAME = 'messageCenter',
        $ = layui.jquery,
        dropdown = layui.dropdown;

    var message = function (opt) {
        this.option = opt;
    };

    message.prototype.render = function (opt) {
        var option = {
            elem: opt.elem,
            url: opt.url ? opt.url : false,
            height: opt.height,
            data: opt.data
        }
        if (option.url != false) {
            $.get(option.url, function (result) {
                const { code, success, data } = result;
                $(`${opt.elem}`).append(`<li class="layui-nav-item" lay-unselect="">
                    <a href="#" class="notice layui-icon layui-icon-notice"></a>
                    </li>`);
                if (code == 200 || success) {
                    option.data = data;
                    dropdown.render({
                        elem: option.elem,
                        align: "center",
                        content: createHtml(option),
                    });
                    // 绑定点击事件
                    bindClickEvents();
                }
            });
        }
        return new message(option);
    }

    message.prototype.click = function (callback) {
        $("*[notice-id]").click(function (event) {
            event.preventDefault();
            var id = $(this).attr("notice-id");
            var title = $(this).attr("notice-title");
            var context = $(this).attr("notice-context");
            var form = $(this).attr("notice-form");
            callback(id, title, context, form);
        })
    }

    function createHtml(option) {

        var count = 0;
        // 增加整体宽度到 550px
        var notice = '<div class="pear-message-center" style="width:550px;"><div class="layui-tab layui-tab-brief">'
        var noticeTitle = '<ul class="layui-tab-title">';
        // 调整内容区域样式
        var noticeContent = '<div class="layui-tab-content" style="height:' + option.height + ';overflow-x: hidden;padding:10px;">';

        $.each(option.data, function (i, item) {

            noticeTitle += `<li class="${i === 0 ? 'layui-this' : ''}">${item.title}</li>`;
            noticeContent += '<div class="layui-tab-item layui-show">';


            $.each(item.children, function (i, note) {
                count++;
                
                var priority = '';
                var priorityClass = '';
                var priorityDot = '';
                if (note.title && note.title.indexOf('[P1]') >= 0) {
                    priority = 'P1';
                    priorityClass = 'priority-p1';
                    priorityDot = '<span class="priority-dot priority-dot-p1"></span>';
                } else if (note.title && note.title.indexOf('[P2]') >= 0) {
                    priority = 'P2';
                    priorityClass = 'priority-p2';
                    priorityDot = '<span class="priority-dot priority-dot-p2"></span>';
                }
                
                var isHandled = note.is_handled === true;
                var handledClass = isHandled ? 'message-handled' : '';
                var handledStyle = isHandled ? 'background-color: #f5f5f5; opacity: 0.7;' : '';
                
                noticeContent += '<div class="message-item ' + priorityClass + ' ' + handledClass + '" style="padding:10px 15px;font-size:13px;line-height:1.6;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;' + handledStyle + '"' +
                    ' data-ticket-id="' + note.id + '">';

                noticeContent += '<div class="message-title" style="color:#333;font-weight:500;flex:1;display:flex;align-items:center;gap:8px;' + (isHandled ? 'text-decoration: line-through; color: #999;' : '') + '">';
                noticeContent += priorityDot;
                noticeContent += '<span>' + note.title + '</span>';
                if (isHandled) {
                    noticeContent += '<span style="font-size:11px;color:#999;background:#e0e0e0;padding:2px 6px;border-radius:3px;margin-left:8px;">已处理</span>';
                }
                noticeContent += '</div>';
                
                noticeContent += '<div style="display:flex;gap:8px;">';
                
                if (isHandled) {
                    noticeContent += '<button class="layui-btn layui-btn-xs layui-btn-primary message-revoke-btn"' +
                        ' data-ticket-id="' + note.id + '" data-ticket-title="' + note.title + '">撤回</button>';
                    noticeContent += '<button class="layui-btn layui-btn-xs layui-btn-disabled" disabled style="background:#ccc;border-color:#ccc;">通知</button>';
                } else {
                    noticeContent += '<button class="layui-btn layui-btn-xs layui-btn-normal message-handle-btn"' +
                        ' data-ticket-id="' + note.id + '">处理</button>';
                    noticeContent += '<button class="layui-btn layui-btn-xs layui-btn-primary message-notify-btn"' +
                        ' data-ticket-id="' + note.id + '" data-ticket-title="' + note.title + '">通知</button>';
                }
                
                noticeContent += '</div>';
                
                noticeContent += '</div>';
            })

            noticeContent += '</div>';
        })

        noticeTitle += '</ul>';
        noticeContent += '</div>';
        notice += noticeTitle;
        notice += noticeContent;
        notice += "</div></div>"

        return notice;
    }

    function bindClickEvents() {
        $(document).off('click', '.message-handle-btn').on('click', '.message-handle-btn', function(e) {
            e.stopPropagation();
            var ticketId = $(this).data('ticket-id');
            var $btn = $(this);
            var $item = $btn.closest('.message-item');
            
            $.ajax({
                url: '/api/notification/handle/' + ticketId,
                type: 'POST',
                success: function(res) {
                    if (res.code === 200 || res.success) {
                        layer.msg('已标记为已处理，正在跳转...', {icon: 1, time: 1000});
                        
                        $item.addClass('message-handled');
                        $item.css({
                            'background-color': '#f5f5f5',
                            'opacity': '0.7'
                        });
                        
                        var $titleDiv = $item.find('.message-title');
                        $titleDiv.css({
                            'text-decoration': 'line-through',
                            'color': '#999'
                        });
                        $titleDiv.find('span').first().after('<span class="handled-tag" style="font-size:11px;color:#999;background:#e0e0e0;padding:2px 6px;border-radius:3px;margin-left:8px;">已处理</span>');
                        
                        var $btnContainer = $item.find('div').last();
                        $btnContainer.html(
                            '<button class="layui-btn layui-btn-xs layui-btn-primary message-revoke-btn"' +
                            ' data-ticket-id="' + ticketId + '">撤回</button>' +
                            '<button class="layui-btn layui-btn-xs layui-btn-disabled" disabled style="background:#ccc;border-color:#ccc;">通知</button>'
                        );
                        
                        setTimeout(function() {
                            window.open('/system/ticket/view/' + ticketId, '_blank');
                        }, 500);
                    } else {
                        layer.msg(res.msg || '操作失败', {icon: 2, time: 2000});
                    }
                },
                error: function() {
                    layer.msg('网络错误，请重试', {icon: 2, time: 2000});
                }
            });
        });
        
        $(document).off('click', '.message-revoke-btn').on('click', '.message-revoke-btn', function(e) {
            e.stopPropagation();
            var ticketId = $(this).data('ticket-id');
            var ticketTitle = $(this).data('ticket-title');
            var $btn = $(this);
            var $item = $btn.closest('.message-item');
            
            $.ajax({
                url: '/api/notification/revoke/' + ticketId,
                type: 'POST',
                success: function(res) {
                    if (res.code === 200 || res.success) {
                        layer.msg('已撤回处理状态', {icon: 1, time: 1500});
                        
                        $item.removeClass('message-handled');
                        $item.css({
                            'background-color': '',
                            'opacity': ''
                        });
                        
                        var $titleDiv = $item.find('.message-title');
                        $titleDiv.css({
                            'text-decoration': '',
                            'color': '#333'
                        });
                        $titleDiv.find('.handled-tag').remove();
                        
                        var $btnContainer = $item.find('div').last();
                        $btnContainer.html(
                            '<button class="layui-btn layui-btn-xs layui-btn-normal message-handle-btn"' +
                            ' data-ticket-id="' + ticketId + '">处理</button>' +
                            '<button class="layui-btn layui-btn-xs layui-btn-primary message-notify-btn"' +
                            ' data-ticket-id="' + ticketId + '" data-ticket-title="' + ticketTitle + '">通知</button>'
                        );
                    } else {
                        layer.msg(res.msg || '操作失败', {icon: 2, time: 2000});
                    }
                },
                error: function() {
                    layer.msg('网络错误，请重试', {icon: 2, time: 2000});
                }
            });
        });
        
        $(document).off('click', '.message-notify-btn').on('click', '.message-notify-btn', function(e) {
            e.stopPropagation();
            var ticketId = $(this).data('ticket-id');
            var ticketTitle = $(this).data('ticket-title');
            
            layer.msg('已发送通知：' + ticketTitle, {icon: 1, time: 2000});
            
            console.log('发送通知，工单ID：', ticketId, '标题：', ticketTitle);
        });
    }

    exports(MOD_NAME, new message());
})
