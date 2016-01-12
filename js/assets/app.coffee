<% if Rails.env.development? %>
window.uploadUrl = 'http://192.168.6.4'
window.apiUrl = 'http://192.168.6.4/api/1.0'
<% else %>
window.uploadUrl = ''
window.apiUrl = '/api/1.0'
<% end %>

window.getVlc = ->
  vlc = null
  if window.document['vlc']
    vlc = window.document['vlc']
  if navigator.appName.indexOf('Microsoft Internet') == -1 && document.embeds && document.embeds['vlc']
    vlc = document.embeds['vlc']
  else
    vlc = document.getElementById('vlc')
  return vlc

window.playVlc = (stream_url) ->
  stream_url = stream_url || 'main_profile'
  stream_url = if stream_url == 'main_profile' then 'main_stream_url' else 'sub_stream_url'
  vlc = getVlc()
  if vlc
    ip = location.hostname
    rtsp_auth = false
    port = 554
    stream_path = 'main_stream'
    $.ajax({
      cache: false,
      url: "#{window.apiUrl}/misc.json",
      data: {
        'items[]': [stream_url]
      },
      headers: {
        'Set-Cookie': 'token=' + getCookie('token')
      },
      dataType: 'json',
      success: (data) ->
        rtsp_auth = data.items.rtsp_auth
        port = data.items.port
        stream_path = data.items.stream_path

        mrl = 'rtsp://'
        if rtsp_auth == true
          mrl += getCookie('username') + ':' + getCookie('password') + '@'
        mrl += ip
        if port != 554
          mrl += ':' + port
        mrl += '/' + stream_path
        vlc.MRL = mrl
        vlc.Stop()
        setTimeout(->
          vlc.Play()
        , 500)
    })

window.stopVlc = ->
  vlc = getVlc()
  if vlc
    vlc.Stop()

# 写入cookie
window.setCookie = (name, value) ->
  exp = new Date()
  exp.setTime(exp.getTime() + 1 * 24 * 60 * 60 * 1000)
  document.cookie = name + "="+ escape(value) + ";expires=" + exp.toGMTString() + ";path=/"

# 读取cookie
window.getCookie = (name) ->
  reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)")
  if arr = document.cookie.match(reg)
    return unescape(arr[2])
  else
    return null

# 删除cookie
window.delCookie = (name) ->
    exp = new Date()
    exp.setTime(exp.getTime() - 1)
    cval = getCookie(name)
    if cval != null
      document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString()

if location.href.indexOf('login') == -1
  token = getCookie('token')
  if token
    $.ajax(
      url: "#{window.apiUrl}/login.json"
      type: 'POST'
      data: JSON.stringify({token: token})
      success: (data) ->
        if data.success == false
          delCookie('username')
          delCookie('userrole')
          delCookie('token')
          setTimeout(->
            location.href = '/login'
          , 200)
    )
  else
    location.href = '/login'

window.dateFormat = (str, format) ->
  if !str
    return ''
  if Object.prototype.toString.call(str) == '[object Date]'
    d = str
  else if str.indexOf('/Date(') != -1
    d = new Date(parseInt(str.replace('/Date(', '').replace(')/', ''), 10));
  else
    d = new Date(str)
  if d.toString() == 'Invalid Date'
    return ''
  o = {
    'M+': d.getMonth() + 1,
    'd+': d.getDate(),
    'h+': d.getHours(),
    'm+': d.getMinutes(),
    's+': d.getSeconds(),
    'q+': Math.floor((d.getMonth() + 3) / 3),
    'S': d.getMilliseconds()
  }
  if (/(y+)/.test(format))
    format = format.replace(RegExp.$1, (d.getFullYear() + '').substr(4 - RegExp.$1.length));
  for k of o
    if (new RegExp('(' + k + ')').test(format))
      n = if RegExp.$1.length == 1 then o[k] else ('00' + o[k]).substr(('' + o[k]).length)
      format = format.replace(RegExp.$1, n)
  format

$(->
  $(document).scroll((e)->
    left = $(this).scrollLeft()
    $('.sidebar-mask').css('left', '-' + left + 'px')
    return
  )
)

window.ipcApp = angular.module('ipcApp', [])
ipcApp.config([
  '$sceProvider'
  '$httpProvider'
  ($sceProvider, $httpProvider) ->
    $sceProvider.enabled(false)
    # 设置默认cookie传输
    $httpProvider.defaults.headers.common['Set-Cookie'] = 'token=' + getCookie('token')
])

ipcApp.controller 'navbarController', [
  '$scope'
  '$http'
  ($scope, $http) ->
    roleObj = {
      administrator: '管理员',
      operator: '操作员',
      user: '用户'
    }
    $scope.role = getCookie('userrole')
    $scope.username = getCookie('username') || ''
    $scope.userrole = roleObj[$scope.role] || ''

    $scope.logout = ->
      $http.get "#{window.apiUrl}/logout.json"

      delCookie('username')
      delCookie('userrole')
      delCookie('token')
      setTimeout(->
        location.href = '/login'
      , 200)
]

ipcApp.directive('ngIcheck', ($compile) ->
  return {
    restrict: 'A',
    require: '?ngModel',
    link: ($scope, $element, $attrs, $ngModel) ->
      if (!$ngModel)
        return
      $element.iCheck({
        checkboxClass: 'icheckbox_square-blue',
        radioClass: 'iradio_square-blue',
        increaseArea: '20%'
      }).on('ifClicked', (event) ->
        if ($attrs.type == 'checkbox')
          $scope.$apply( ->
            $ngModel.$setViewValue(!($ngModel.$modelValue == undefined ? false : $ngModel.$modelValue))
          )
        else
          $scope.$apply( ->
            $ngModel.$setViewValue($attrs.value);
          )
      )

      $scope.$watch($attrs.ngModel, (newValue) ->
        if newValue == true && $attrs.type == 'checkbox'
          $element.iCheck('check').iCheck('update')
      )
  }
)

ipcApp.directive('ngBswitch', ($compile) ->
  return {
    restrict: 'A',
    require: '?ngModel',
    link: ($scope, $element, $attrs, $ngModel) ->
      if (!$ngModel)
        return
      $element.bootstrapSwitch({
        onText: $element.attr('ontext') || '开',
        offText: $element.attr('offtext') || '关'
      }).on('switchChange.bootstrapSwitch', (e, state) ->
        $scope.$apply( ->
          $ngModel.$setViewValue(state);
        )
      )
      if $scope[$attrs.ngModel]
        $element.bootstrapSwitch('state', true, true)
      $scope.$watch($attrs.ngModel, (newValue) ->
        $element.bootstrapSwitch('state', newValue || false, true);
      )
  }
)

ipcApp.directive('ngSlider', ($compile) ->
  return {
    restrict: 'A',
    require: '?ngModel',
    link: ($scope, $element, $attrs, $ngModel) ->
      if (!$ngModel)
        return
      $element.noUiSlider({
        start: [ $scope[$attrs.ngModel] || 0 ],
        step: 1,
        connect: 'lower',
        range: {
          'min': [ parseInt($attrs.min, 10) || 0 ],
          'max': [ parseInt($attrs.max, 10) || 100 ]
        }
      }).on('slide', (e, val) ->
        $scope.$apply( ->
          $ngModel.$setViewValue(parseInt(val));
        )
      )
  }
)

ipcApp.directive('ngColor', ($compile) ->
  return {
    restrict: 'A',
    require: '?ngModel',
    link: ($scope, $element, $attrs, $ngModel) ->
      if (!$ngModel)
        return
      $element.colorpicker().on('changeColor', (e) ->
        rgb = e.color.toRGB()
        $scope.$apply( ->
          $ngModel.$setViewValue({
            red: rgb.r,
            green: rgb.g,
            blue: rgb.b,
            alpha: rgb.a
          });
        )
      )
      $scope.$watch($attrs.ngModel, (newValue) ->
        if newValue
          hex = '#' + ((1 << 24) | (parseInt(newValue.red) << 16) | (parseInt(newValue.green) << 8) | parseInt(newValue.blue)).toString(16).substr(1)
          hex.toUpperCase()
          $element.colorpicker('setValue', hex, true);
          $element.find('.color-block').css('background', hex)
          $element.parent().find('.color-text').val(hex)
      )
  }
)

ipcApp.directive('ngShelter', ($compile) ->
  return {
    restrict: 'A',
    require: '?ngModel',
    link: ($scope, $element, $attrs, $ngModel) ->
      if (!$ngModel)
        return
      $parent = $element.parent()
      parent_size = {
        width: $parent.width(),
        height: $parent.height()
      }
      rect = $scope[$attrs.ngModel]
      if !rect
        rect = {
          left: 0,
          top: 0,
          width: 100,
          height: 100
        }
      $element.css({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      }).draggable({
        containment: $parent,
        iframeFix: true,
        stop: (e, ui) ->
          if ui.position.left + rect.width > parent_size.width
            rect.left = parent_size.width - rect.width
            $(this).css('left', rect.left)
          else
            rect.left = ui.position.left
          if ui.position.top + rect.height > parent_size.height
            rect.top = parent_size.height - rect.height
            $(this).css('top', rect.top)
          else
            rect.top = ui.position.top
          $scope.$apply( ->
            $ngModel.$setViewValue(rect)
          )
      }).resizable({
        containment: $parent,
        minWidth: parseInt($attrs.minwidth, 10) || 50,
        minHeight: parseInt($attrs.minheight, 10) || 50,
        stop: (e, ui) ->
          rect.width = ui.size.width
          rect.height = ui.size.height
          $scope.$apply( ->
            $ngModel.$setViewValue(rect)
          )
      })
      $scope.$watch($attrs.ngModel, (newValue) ->
        if newValue
          rect = newValue
          $element.css({
            left: newValue.left,
            top: newValue.top,
            width: newValue.width,
            height: newValue.height
          })
      )
  }
)

ipcApp.directive('ngDatetime', ($compile) ->
  return {
    restrict: 'A',
    require: '?ngModel',
    link: ($scope, $element, $attrs, $ngModel) ->
      if (!$ngModel)
        return
      $element.datetimepicker()
  }
)

ipcApp.directive('ngTimegantt', ($compile) ->
  return {
    restrict: 'A',
    require: '?ngModel',
    link:  ($scope, $element, $attrs, $ngModel) ->
      if (!$ngModel)
        return
      $element.timegantt({
        width: 782
      }).on('changeSelected', (e, data) ->
        $scope.$apply( ->
          $ngModel.$setViewValue(data)
        )
      )
  }
)

# ipcApp.directive('ngChart', ($compile) ->
#   return {
#     restrict: 'A',
#     require: '?ngModel',
#     link:  ($scope, $element, $attrs, $ngModel) ->
#       if (!$ngModel)
#         return
#       $parent = $element.parent()
#       $element[0].width = $parent.width()
#       $element[0].height = $parent.height()
#       ctx = $element[0].getContext('2d')
#       labels = []
#       data = []
#       for i in [60...-1] by -5
#         labels.push(i + 's')
#         data.push(0)
#       if data
#         data.push($scope[$attrs.ngModel])
#         data.shift()
      
#       chart_options = {
#         pointDot: false,
#         scaleLineColor: $attrs.scalelinecolor,
#         scaleGridLineColor: $attrs.scalegridlinecolor,
#         showTooltips: false,
#         scaleOverride: true,
#         scaleSteps : 10,
#         scaleStepWidth: 10,
#         scaleStartValue: 0,
#         animation: false
#       }

#       getLineChartData = (data) ->
#         lineChartData = {
#           labels: labels,
#           datasets: [
#             {
#               label: $attrs.label || 'Chart',
#               fillColor: $attrs.fillcolor || 'rgba(220,220,220,0.2)',
#               strokeColor: $attrs.strokecolor || 'rgba(220,220,220,1)',
#               data: data
#             }
#           ]
#         }

#       draw_chart = ->
#         new Chart(ctx).Line(getLineChartData(data), chart_options);

#       draw_chart(data)

#       $scope.$watch($attrs.ngModel, (newValue) ->
#         if newValue
#           data.push(newValue)
#           data.shift()
#           new Chart(ctx).Line(getLineChartData(data), chart_options);
#       )
#   }
# )
