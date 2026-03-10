
layui.use(['table', 'form', 'jquery'], function () {
    var table = layui.table;
    var form = layui.form;
    var $ = layui.jquery;

    // 初始化表格
    var tableIns = table.render({
        elem: '#logTable',
        url: LOG_DATA_URL,
        page: true,
        cols: [[
            { field: 'id', title: 'ID', sort: true, width: 80 },
            { field: 'username', title: '用户名称', width: 120 },
            { field: 'method', title: '请求方法', width: 100 },
            { field: 'url', title: 'URL', minWidth: 200 },
            { field: 'desc', title: '描述', minWidth: 200 },
            { field: 'ip', title: 'IP地址', width: 150 },
            {
                field: 'success', title: '状态', width: 100, templet: function (d) {
                    return d.success == 1 ? '<span class="layui-badge layui-bg-green">成功</span>' : '<span class="layui-badge layui-bg-orange">失败</span>';
                }
            },
            { field: 'create_time', title: '操作时间', sort: true, width: 180 }
        ]]
    });

    // 搜索表单提交
    form.on('submit(searchBtn)', function (data) {
        tableIns.reload({
            where: data.field,
            page: {
                curr: 1
            }
        });
        return false;
    });

    // 日志类型切换
    function reloadTableWithFilters(newUrl) {
        // 获取当前搜索表单的值
        var searchParams = form.val("searchForm");

        // 切换按钮样式
        if (newUrl.includes('data')) {
            $('#allLogBtn').addClass('layui-btn-normal').siblings().removeClass('layui-btn-normal');
        } else if (newUrl.includes('login_log')) {
            $('#loginLogBtn').addClass('layui-btn-normal').siblings().removeClass('layui-btn-normal');
        } else if (newUrl.includes('operate_log')) {
            $('#operateLogBtn').addClass('layui-btn-normal').siblings().removeClass('layui-btn-normal');
        }

        tableIns.reload({
            url: newUrl,
            where: searchParams, // 核心修复：带上搜索条件
            page: {
                curr: 1
            }
        });
    }

    $('#allLogBtn').click(function () {
        reloadTableWithFilters(LOG_DATA_URL);
    });

    $('#loginLogBtn').click(function () {
        reloadTableWithFilters(LOG_LOGIN_URL);
    });

    $('#operateLogBtn').click(function () {
        reloadTableWithFilters(LOG_OPERATE_URL);
    });
});
