ipcApp.controller('loginController', [
    '$scope', '$timeout', '$http',
    function ($scope, $timeout, $http) {
        var valid;
        $scope.username = '';
        $scope.password = '';
        $scope.language = '简体中文';
        $scope.username_msg = '';
        $scope.password_msg = '';
        $scope.login_fail_msg = '';
        $('#user_name').focus();
        valid = {
            username: function (value) {
                if (value) {
                    $scope.username_msg = '';
                    return true;
                } else {
                    $scope.username_msg = '请输入用户名';
                    return false;
                }
            },
            password: function (value) {
                if (value) {
                    $scope.password_msg = '';
                    return true;
                } else {
                    $scope.password_msg = '请输入密码';
                    return false;
                }
            }
        };
        $scope.valid_username = function () {
            valid.username($scope.username);
            $scope.login_fail_msg = '';
        };
        $scope.valid_password = function () {
            valid.password($scope.password);
            $scope.login_fail_msg = '';
        };
        $scope.change_language = function (value) {
            $scope.language = value;
        };
        $scope.user_keydown = function (e) {
            var obj;
            if (e.which === 13) {
                obj = {
                    target: $('#btn_login')[0]
                };
                $scope.login(obj);
            }
        };
        $scope.login = function (e) {
            var $btn, pwd;
            if (!valid.username($scope.username) || !valid.password($scope.password)) {
                return;
            }
            pwd = CryptoJS.SHA1($scope.password).toString();
            $btn = $(e.target);
            $btn.button('loading');
            $http.post("" + window.apiUrl + "/login.json", {
                username: $scope.username,
                password: pwd
            }).success(function (data) {
                $btn.button('reset');
                if (data.success === true) {
                    setCookie('username', $scope.username);
                    setCookie('password', $scope.password);
                    setCookie('userrole', data.role);
                    setCookie('token', data.token);
                    setTimeout(function () {
                        location.href = '/home';
                    }, 200);
                } else {
                    $scope.login_fail_msg = '用户名或密码错误';
                }
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                delCookie('username');
                delCookie('userrole');
                delCookie('token');
                $scope.login_fail_msg = '登录失败，请重试';
            });
        };
    }
]);