// 增加前端参数预处理逻辑
$.ajax({
    url: basePath + 'system/ticket/table',
    type: 'GET',
    data: {
        // 修改：增加参数合法性校验
        page: Math.max(1, parseInt(request.args.get('page', 1)) || 1),
        limit: Math.max(1, parseInt(request.args.get('limit', 15)) || 15)
    },
    dataType: 'json',
    success: function(res) {
        if (res.code === 0) {
            console.log('获取工单数据成功:', res.data);
        } else {
            layer.msg(res.msg || '获取工单数据失败', {icon: 2});
        }
    },
    error: function(xhr) {
        // 修改：增加错误状态码识别
        if(xhr.status === 400) {
            layer.msg(xhr.responseJSON.msg, {icon: 2});
        } else {
            layer.msg('网络请求失败，请稍后重试', {icon: 2});
        }
    }
});