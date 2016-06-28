window.uploadUrl = '';
window.apiUrl = '/api/1.0';
var token;

window.getVlc = function () {
    var vlc = null;
    if (window.document.vlc) {
        vlc = window.document.vlc;
    }
    if (navigator.appName.indexOf('Microsoft Internet') === -1 &&
        document.embeds && document.embeds.vlc) {
        vlc = document.embeds.vlc;
    } else {
        vlc = document.getElementById('vlc');
    }
    return vlc;
};

window.playVlc = function (stream_url) {
    var ip, port, rtsp_auth, stream_path, vlc;
    stream_url = stream_url || 'main_profile';
    stream_url = stream_url === 'main_profile' ? 'main_stream_url' : 'sub_stream_url';
    vlc = getVlc();
    if (vlc) {
        ip = location.hostname;
        rtsp_auth = false;
        port = 554;
        stream_path = 'main_stream';
        return $.ajax({
            cache: false,
            url: window.apiUrl + '/misc.json',
            data: {
                'items[]': [stream_url]
            },
            headers: {
                'Set-Cookie': 'token=' + getCookie('token')
            },
            dataType: 'json',
            success: function (data) {
                var mrl;
                rtsp_auth = data.items.rtsp_auth;
                port = data.items.port;
                stream_path = data.items.stream_path;
                mrl = 'rtsp://';
                if (rtsp_auth === true) {
                    mrl += getCookie('username') + ':' + getCookie('password') + '@';
                }
                mrl += ip;
                if (port !== 554) {
                    mrl += ':' + port;
                }
                mrl += '/' + stream_path;
                vlc.MRL = mrl;
                vlc.playlist.stop();
                setTimeout(function () {
                    var options = new Array(":network-caching=300",
                                            "--rtsp-tcp");
                    var id = vlc.playlist.add(mrl, "0", options);
                    vlc.playlist.playItem(id);
                }, 500);
            }
        });
    }
};

window.stopVlc = function () {
    var vlc;
    vlc = getVlc();
    if (vlc) {
        vlc.playlist.stop();
    }
};

// 写入cookie
window.setCookie = function (name, value) {
    var exp;
    exp = new Date();
    exp.setTime(exp.getTime() + 1 * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + escape(value) + ';expires=' + exp.toGMTString() + ';path=/';
};

// 读取cookie
window.getCookie = function (name) {
    var arr, reg;
    reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)');
    arr = document.cookie.match(reg);
    if (arr) {
        return unescape(arr[2]);
    } else {
        return null;
    }
};

// 删除cookie
window.delCookie = function (name) {
    var cval, exp;
    exp = new Date();
    exp.setTime(exp.getTime() - 1);
    cval = getCookie(name);
    if (cval !== null) {
        document.cookie = name + '=' + cval + ';expires=' + exp.toGMTString();
    }
};

if (location.href.indexOf('login') === -1) {
    token = getCookie('token');
    if (token) {
        $.ajax({
            url: window.apiUrl + '/login.json',
            type: 'POST',
            data: JSON.stringify({
                token: token
            }),
            contentType: 'application/json',
            success: function (data) {
                if (data.success === false) {
                    delCookie('username');
                    delCookie('userrole');
                    delCookie('token');
                    setTimeout(function () {
                        location.href = '/login';
                    }, 200);
                }
            }
        });
    } else {
        location.href = '/login';
    }
}

window.dateFormat = function (str, format) {
    var d, k, n, o;
    if (!str) {
        return '';
    }
    if (Object.prototype.toString.call(str) === '[object Date]') {
        d = str;
    } else if (str.indexOf('/Date(') !== -1) {
        d = new Date(parseInt(str.replace('/Date(', '').replace(')/', ''), 10));
    } else {
        d = new Date(str);
    }
    if (d.toString() === 'Invalid Date') {
        return '';
    }
    o = {
        'M+': d.getMonth() + 1,
        'd+': d.getDate(),
        'h+': d.getHours(),
        'm+': d.getMinutes(),
        's+': d.getSeconds(),
        'q+': Math.floor((d.getMonth() + 3) / 3),
        'S': d.getMilliseconds()
    };
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (d.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (k in o) {
        if (new RegExp('(' + k + ')').test(format)) {
            n = RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length);
            format = format.replace(RegExp.$1, n);
        }
    }
    return format;
};

$(function () {
    $(document).scroll(function (e) {
        var left;
        left = $(this).scrollLeft();
        $('.sidebar-mask').css('left', '-' + left + 'px');
    });
});

window.ipcApp = angular.module('ipcApp', []);

ipcApp.config([
    '$sceProvider', '$httpProvider',
    function ($sceProvider, $httpProvider) {
        $sceProvider.enabled(false);
        // 设置默认cookie传输
        $httpProvider.defaults.headers.common['Set-Cookie'] = 'token=' + getCookie('token');
    }
]);

ipcApp.controller('navbarController', [
    '$scope', '$http',
    function ($scope, $http) {
        var roleObj;
        roleObj = {
            administrator: '管理员',
            operator: '操作员',
            user: '用户'
        };
        $scope.role = getCookie('userrole');
        $scope.username = getCookie('username') || '';
        $scope.userrole = roleObj[$scope.role] || '';
        $scope.logout = function () {
            $http.get(window.apiUrl + '/logout.json');
            delCookie('username');
            delCookie('userrole');
            delCookie('token');
            setTimeout(function () {
                location.href = '/login';
            }, 200);
        };
    }
]);

ipcApp.directive('ngIcheck', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function ($scope, $element, $attrs, $ngModel) {
            if (!$ngModel) {
                return;
            }
            $element.iCheck({
                checkboxClass: 'icheckbox_square-blue',
                radioClass: 'iradio_square-blue',
                increaseArea: '20%'
            }).on('ifClicked', function (event) {
                if ($attrs.type === 'checkbox') {
                    $scope.$apply(function () {
                        var val = !($ngModel.$modelValue === undefined ? false : $ngModel.$modelValue);
                        $ngModel.$setViewValue(val);
                    });
                } else {
                    $scope.$apply(function () {
                        $ngModel.$setViewValue($attrs.value);
                    });
                }
            });
            $scope.$watch($attrs.ngModel, function (newValue) {
                if (newValue === true && $attrs.type === 'checkbox') {
                    $element.iCheck('check').iCheck('update');
                }
            });
        }
    };
}]);

ipcApp.directive('ngBswitch', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function ($scope, $element, $attrs, $ngModel) {
            if (!$ngModel) {
                return;
            }
            $element.bootstrapSwitch({
                onText: $element.attr('ontext') || '开',
                offText: $element.attr('offtext') || '关'
            }).on('switchChange.bootstrapSwitch', function (e, state) {
                $scope.$apply(function () {
                    $ngModel.$setViewValue(state);
                });
            });
            if ($scope[$attrs.ngModel]) {
                $element.bootstrapSwitch('state', true, true);
            }
            $scope.$watch($attrs.ngModel, function (newValue) {
                $element.bootstrapSwitch('state', newValue || false, true);
            });
        }
    };
}]);

ipcApp.directive('ngSlider', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function ($scope, $element, $attrs, $ngModel) {
            if (!$ngModel) {
                return;
            }
            return $element.noUiSlider({
                start: [$scope[$attrs.ngModel] || 0],
                step: 1,
                connect: 'lower',
                range: {
                    'min': [parseInt($attrs.min, 10) || 0],
                    'max': [parseInt($attrs.max, 10) || 100]
                }
            }).on('slide', function (e, val) {
                $scope.$apply(function () {
                    $ngModel.$setViewValue(parseInt(val));
                });
            });
        }
    };
}]);

ipcApp.directive('ngColor', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function ($scope, $element, $attrs, $ngModel) {
            if (!$ngModel) {
                return;
            }
            $element.colorpicker().on('changeColor', function (e) {
                var rgb;
                rgb = e.color.toRGB();
                if(!$scope.$$phase) {
                    $scope.$apply(function () {
                        $ngModel.$setViewValue({
                            red: rgb.r,
                            green: rgb.g,
                            blue: rgb.b,
                            alpha: rgb.a
                        });
                        // $ngModel.$setViewValue(rgb);
                    });
                }
            });
            $scope.$watch($attrs.ngModel, function (newValue) {
                // var hex;
                if (newValue) {
                    // hex = '#' + ((1 << 24) | (parseInt(newValue.red) << 16) | (parseInt(newValue.green) << 8) | parseInt(newValue.blue)).toString(16).substr(1);
                    // hex.toUpperCase();
                    var rgba = 'rgba(' + newValue.red + ', ' + newValue.green + ', ' + newValue.blue + ', ' + newValue.alpha + ')';
                    $element.colorpicker('setValue', rgba);
                    $element.find('.color-block').css('background', rgba);
                    $element.parent().find('.color-text').val(rgba);
                }
            });
        }
    };
}]);

ipcApp.directive('ngShelter', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function ($scope, $element, $attrs, $ngModel) {
            var $parent, parent_size, rect;
            if (!$ngModel) {
                return;
            }
            $parent = $element.parent();
            parent_size = {
                width: $parent.width(),
                height: $parent.height()
            };
            rect = $scope[$attrs.ngModel];
            if (!rect) {
                rect = {
                    left: 0,
                    top: 0,
                    width: 100,
                    height: 100
                };
            }
            $element.css({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            }).draggable({
                containment: $parent,
                iframeFix: true,
                stop: function (e, ui) {
                    if (ui.position.left + rect.width > parent_size.width) {
                        rect.left = parent_size.width - rect.width;
                        $(this).css('left', rect.left);
                    } else {
                        rect.left = ui.position.left;
                    }
                    if (ui.position.top + rect.height > parent_size.height) {
                        rect.top = parent_size.height - rect.height;
                        $(this).css('top', rect.top);
                    } else {
                        rect.top = ui.position.top;
                    }
                    $scope.$apply(function () {
                        $ngModel.$setViewValue(rect);
                    });
                }
            }).resizable({
                containment: $parent,
                minWidth: parseInt($attrs.minwidth, 10) || 50,
                minHeight: parseInt($attrs.minheight, 10) || 50,
                stop: function (e, ui) {
                    rect.width = ui.size.width;
                    rect.height = ui.size.height;
                    $scope.$apply(function () {
                        $ngModel.$setViewValue(rect);
                    });
                }
            });
            $scope.$watch($attrs.ngModel, function (newValue) {
                if (newValue) {
                    rect = newValue;
                    $element.css({
                        left: newValue.left,
                        top: newValue.top,
                        width: newValue.width,
                        height: newValue.height
                    });
                }
            });
        }
    };
}]);

ipcApp.directive('ngDatetime', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function ($scope, $element, $attrs, $ngModel) {
            if (!$ngModel) {
                return;
            }
            return $element.datetimepicker().on('dp.change', function (e) {
                $scope.$apply(function () {
                    $ngModel.$setViewValue(e.date.format('YYYY-MM-DD HH:mm:ss'));
                });
            });
        }
    };
}]);

ipcApp.directive('ngTimegantt', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function ($scope, $element, $attrs, $ngModel) {
            if (!$ngModel) {
                return;
            }
            $element.timegantt({
                width: 782
            }).on('changeSelected', function (e, data) {
                $scope.$apply(function () {
                    $ngModel.$setViewValue(data);
                });
            });
        }
    };
}]);

ipcApp.directive('ngFileread', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function ($scope, $element, $attrs, $ngModel) {
            if (!$ngModel) {
                return;
            }
            $element.on('change', function (e) {
                $scope.$apply(function () {
                    $ngModel.$setViewValue(e.target.value);
                });
            });
            $scope.$watch($attrs.ngModel, function (newValue) {
                if (newValue === '') {
                    $element.val(newValue);
                }
            });
        }
    }
}]);