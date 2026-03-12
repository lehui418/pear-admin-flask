
layui.use(['jquery', 'layer', 'cropper', 'popup'], function () {
    let $ = layui.jquery
    let layer = layui.layer
    let cropper = layui.cropper
    let popup = layui.popup

    let options = {
        aspectRatio: 1 / 1, // 裁剪框比例
        preview: '#previewImage', // 预览div
        viewmode: 1
    }

    $('#sourceImage').attr('src', parent.layui.$('#avatar').attr('src'))
    $('#sourceImage').cropper(options)

    window.submitForm = function () {
        $('#sourceImage').crossOrigin = 'anonymous'//解决跨域图片问题
        $('#sourceImage').cropper('getCroppedCanvas', {
            width: 280,
            height: 140
        }).toBlob(function (blob) {
            let timeStamp = Date.parse(new Date())
            let fileName = timeStamp + '.jpg'
            let formData = new FormData()
            formData.append('file', blob, fileName)
            formData.append('fileName', fileName)
            formData.append('fileToken', timeStamp)
            $.ajax({
                method: 'post',
                url: uploadUrl, //用于文件上传的服务器端请求地址
                data: formData,
                processData: false,
                contentType: false,
                success: function (result) {
                    if (result.success) {
                        // 修改 avatar 字段
                        $.ajax({
                            method: 'put',
                            url: updateAvatarUrl,
                            data: JSON.stringify({ avatar: result.data }),
                            dataType: 'json',
                            contentType: 'application/json',
                            success: function (res) {
                                if (res.success) {
                                    // 关闭当前弹层
                                    parent.layui.$('#avatar').attr('src', result.data.src)
                                    top.layui.$('#avatar').attr('src', result.data.src)
                                    parent.layer.close(parent.layer.getFrameIndex(window.name))
                                } else {
                                    popup.failure('上传失败')
                                }
                            }
                        })
                    } else {
                        popup.failure('上传失败')
                    }
                }
            })
        })
    }

    $('.pear-btn').on('click', function () {
        let event = $(this).attr('cropper-event')
        if (event === 'rotate') {
            let option = $(this).attr('data-option')
            $('#sourceImage').cropper('rotate', option)
        } else if (event === 'reset') {
            $('#sourceImage').cropper('reset')
        }
        $('#uploadPicture').change(function () {
            let r = new FileReader()
            let f = this.files[0]
            let uploadFileSize = f.size / 1024
            if (uploadFileSize > 5120) {
                parent.layer.msg('上传文件不得超过5m', { icon: 5 })
                return false
            }
            r.readAsDataURL(f)
            r.onload = function (e) {
                $('#sourceImage')
                    .cropper('destroy')
                    .attr('src', this.result)
                    .cropper(options)
            }
        })
    })
})
