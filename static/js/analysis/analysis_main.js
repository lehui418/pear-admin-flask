
layui.use(['jquery', 'layer', 'table', 'admin', 'form'], function () {
    var $ = layui.jquery;
    var layer = layui.layer;
    var table = layui.table;
    var admin = layui.admin;
    var form = layui.form;

    // 初始化统计卡片数据
    function loadOverviewData() {
        $.ajax({
            url: '/system/rights/api/ticket_overview',
            type: 'GET',
            dataType: 'json',
            success: function (res) {
                if (res.success) {
                    $('#pendingCount').text(res.data.pending_count);
                    $('#resolvedTodayCount').text(res.data.resolved_today_count);
                    $('#overdueCount').text(res.data.overdue_count);
                } else {
                    layer.msg('获取统计数据失败: ' + res.msg, { icon: 2 });
                }
            },
            error: function (xhr, status, error) {
                layer.msg('请求统计数据错误: ' + error, { icon: 2 });
            }
        });
    }

    // 初始化表格
    table.render({
        elem: '#pendingTicketTable',
        url: '/system/rights/api/pending_tickets_data',
        method: 'GET',
        page: true,
        limits: [10, 15, 20, 25, 50, 100],
        limit: 10,
        cols: [
            [
                { field: 'id', title: '工单ID', width: 100, sort: true, align: 'center' },
                { field: 'title', title: '工单标题', minWidth: 200 },
                {
                    field: 'priority', title: '优先级', width: 100, align: 'center', templet: function (d) {
                        if (d.priority === 'High') return '<span class="layui-badge layui-bg-red">高</span>';
                        if (d.priority === 'Medium') return '<span class="layui-badge layui-bg-orange">中</span>';
                        if (d.priority === 'Low') return '<span class="layui-badge layui-bg-green">低</span>';
                        if (d.priority === 'Urgent') return '<span class="layui-badge layui-bg-red">紧急</span>'; // Urgent also red
                        return d.priority || '';
                    }
                },
                {
                    field: 'status', title: '状态', width: 120, align: 'center', templet: function (d) {
                        let statusText = d.status || '';
                        if (statusText === '创建/提交') return '<span style="color: #4A90E2; font-weight: bold;">' + statusText + '</span>';
                        else if (statusText === '待分配') return '<span style="color: #FFD700; font-weight: bold;">' + statusText + '</span>';
                        else if (statusText === '处理中') return '<span style="color: #FFA500; font-weight: bold;">' + statusText + '</span>';
                        else if (statusText === '待客户反馈') return '<span style="color: #9B59B6; font-weight: bold;">' + statusText + '</span>';
                        else if (statusText === '待研发处理') return '<span style="color: #FF6B6B; font-weight: bold;">' + statusText + '</span>';
                        else if (statusText === '已解决') return '<span style="color: #2ECC71; font-weight: bold;">' + statusText + '</span>';
                        else if (statusText === '已关闭') return '<span style="color: #95A5A6; font-weight: bold;">' + statusText + '</span>';
                        else if (statusText === '已取消') return '<span style="color: #7F8C8D; font-weight: bold;">' + statusText + '</span>';
                        return statusText;
                    }
                },
                { field: 'create_time', title: '创建时间', width: 180, sort: true, align: 'center' },
                {
                    title: '操作', width: 100, align: 'center', templet: function (d) {
                        return '<button class="layui-btn layui-btn-xs layui-btn-primary" lay-event="view">查看</button>';
                    }
                }
            ]
        ],
        parseData: function (res) { // res 即为原始返回的数据
            return {
                "code": res.code, // 解析接口状态
                "msg": res.msg, // 解析提示文本
                "count": res.count, // 解析数据总数
                "data": res.data // 解析数据列表
            };
        }
    });

    // 监听表格工具条事件
    table.on('tool(pendingTicketTable)', function (obj) {
        var data = obj.data;
        console.log('查看按钮点击，数据：', data);
        console.log('工单ID：', data.id);
        if (obj.event === 'view') {
            // 跳转到工单详情页面
            admin.instances.tabPage.changePage({
                id: data.id,
                url: '/system/ticket/view/' + data.id,
                title: '工单详情 - ' + data.id,
                close: true
            });
        }
    });

    // 搜索功能
    $('#searchKeyword').on('keyup', function (e) {
        if (e.keyCode === 13) { // Enter 键
            performSearch();
        }
    });

    // 刷新按钮点击事件
    $('#refreshBtn').on('click', function () {
        performSearch();
    });

    function performSearch() {
        var keyword = $('#searchKeyword').val();
        table.reload('pendingTicketTable', {
            where: {
                searchKeyword: keyword
            },
            page: {
                curr: 1 // 重新从第一页开始
            }
        });
    }

    // 页面加载时执行
    loadOverviewData(); // 加载统计概览数据

    // 定时刷新概览数据（例如每30秒）
    setInterval(loadOverviewData, 30000);
});
