ipcApp.controller 'loginController', [
  '$scope'
  '$timeout'
  '$http'
  ($scope, $timeout, $http) ->
    $scope.username = ''
    $scope.password = ''
    $scope.language = '简体中文'
    
    $scope.username_msg = ''
    $scope.password_msg = ''
    $scope.login_fail_msg = ''

    $('#user_name').focus()

    valid = {
      username: (value) ->
        if value
          $scope.username_msg = ''
          return true
        else
          $scope.username_msg = '请输入用户名'
          return false
      password: (value) ->
        if value
          $scope.password_msg = ''
          return true
        else
          $scope.password_msg = '请输入密码'
          return false
    }

    $scope.valid_username = ->
      valid.username($scope.username)
      $scope.login_fail_msg = ''

    $scope.valid_password = ->
      valid.password($scope.password)
      $scope.login_fail_msg = ''

    $scope.change_language = (value) ->
      $scope.language = value

    $scope.user_keydown = (e) ->
      if e.which == 13
        obj = {
          target: $('#btn_login')[0]
        }
        $scope.login(obj)

    $scope.login = (e)->
      if !valid.username($scope.username) || !valid.password($scope.password)
        return
      pwd = CryptoJS.SHA1($scope.password).toString()
      $btn = $(e.target)
      $btn.button('loading')
      $http.post "#{window.apiUrl}/login.json",
        username: $scope.username
        password: pwd
      .success (data) ->
        $btn.button('reset')
        if data.success == true
          setCookie('username', $scope.username)
          setCookie('password', $scope.password)
          setCookie('userrole', data.role)
          setCookie('token', data.token)
          setTimeout(->
            location.href = '/home'
          , 200)
        else
          $scope.login_fail_msg = '用户名或密码错误'
      .error (response, status, headers, config) ->
        $btn.button('reset')
        delCookie('username')
        delCookie('userrole')
        delCookie('token')
        $scope.login_fail_msg = '登录失败，请重试'
]
