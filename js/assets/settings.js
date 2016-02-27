window.VIDEO_WIDTH = 750;

window.VIDEO_HEIGHT = 560;

ipcApp.controller('SettingController', [
    '$scope', '$timeout', '$http',
    function ($scope, $timeout, $http) {
        var timer;
        $scope.type = 'base_info';
        $scope.url = window.apiUrl;
        $scope.ajax_msg = {
            type: 'success',
            content: ''
        };
        timer = null;
        $scope.changeType = function (type) {
            stopVlc();
            $('#vlc').remove();
            return $scope.type = type;
        };
        $scope.get_error = function (response, status, headers, config) {
            if (status === 401) {
                delCookie('username');
                delCookie('userrole');
                delCookie('token');
                return setTimeout(function () {
                    return location.href = '/login';
                }, 200);
            } else {
                return $scope.show_msg('alert-danger', '获取信息失败');
            }
        };
        $scope.success = function (message) {
            return $scope.show_msg('alert-success', '保存成功');
        };
        $scope.error = function (response, status, headers, config) {
            if (status === 401) {
                delCookie('username');
                delCookie('userrole');
                delCookie('token');
                return setTimeout(function () {
                    return location.href = '/login';
                }, 200);
            } else if (status === 403) {
                return location.href = '/login';
            } else {
                return $scope.show_msg('alert-danger', '保存失败');
            }
        };
        return $scope.show_msg = function (type, msg) {
            $scope.ajax_msg = {
                type: type,
                content: msg
            };
            $('#msg_modal').modal();
            $timeout.cancel(timer);
            return timer = $timeout(function () {
                return $('#msg_modal').modal('hide');
            }, 2000);
        };
    }
]);

ipcApp.controller('BaseInfoController', [
    '$scope', '$http',
    function ($scope, $http) {
        var add_watch, valid;
        $http.get("" + $scope.$parent.url + "/base_info.json", {
            params: {
                'items[]': ['device_name', 'hwaddr', 'comment', 'location', 'manufacturer', 'model', 'serial', 'firmware', 'hardware'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.serial = data.items.serial;
            $scope.mac = data.items.hwaddr;
            $scope.manufacturer = data.items.manufacturer;
            $scope.model = data.items.model;
            $scope.firmware = data.items.firmware;
            $scope.hardware = data.items.hardware;
            $scope.device_name = data.items.device_name;
            $scope.comment = data.items.comment;
            return $scope.location = data.items.location;
        }).error(function (response, status, headers, config) {
            $scope.$parent.get_error(response, status, headers, config);
            return add_watch();
        });
        $scope.device_name_msg = '';
        $scope.comment_msg = '';
        $scope.location_msg = '';
        valid = function (msg_name, value, msg) {
            if (value && value.length > 32) {
                return $scope[msg_name] = '长度不能超过32个字符';
            } else {
                return $scope[msg_name] = '';
            }
        };
        add_watch = function () {
            $scope.$watch('device_name', function (newValue) {
                if (!newValue) {
                    return $scope.device_name_msg = '设备名称不能为空';
                } else if (newValue.length > 32) {
                    return $scope.device_name_msg = '长度不能超过32个字符';
                } else {
                    return $scope.device_name_msg = '';
                }
            });
            $scope.$watch('comment', function (newValue) {
                return valid('comment_msg', newValue);
            });
            return $scope.$watch('location', function (newValue) {
                return valid('location_msg', newValue);
            });
        };
        return $scope.save = function (e) {
            var $btn;
            if ($scope.device_name_msg || $scope.comment_msg || $scope.location_msg) {
                return;
            }
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/base_info.json", {
                items: {
                    device_name: $scope.device_name,
                    comment: $scope.comment,
                    location: $scope.location
                }
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('UsersController', [
    '$scope', '$http',
    function ($scope, $http) {
        var get_user_list, get_video_access_authentication;
        $scope.operate_type = '';
        $scope.rtsp_auth = false;
        $scope.add_user_name = '';
        $scope.add_password = '';
        $scope.add_role = 'user';
        $scope.add_user_msg = '';
        $scope.current_user = '';
        get_video_access_authentication = function () {
            return $http.get("" + $scope.$parent.url + "/misc.json", {
                params: {
                    'items[]': ['rtsp_auth'],
                    v: new Date().getTime()
                }
            }).success(function (data) {
                return $scope.rtsp_auth = data.items.rtsp_auth;
            }).error(function (response, status, headers, config) {
                return $scope.$parent.get_error(response, status, headers, config);
            });
        };
        get_user_list = function () {
            return $http.get("" + $scope.$parent.url + "/users.json", {
                params: {
                    'items[]': ['role'],
                    v: new Date().getTime()
                }
            }).success(function (data) {
                return $scope.items = data.items;
            }).error(function (response, status, headers, config) {
                return $scope.$parent.get_error(response, status, headers, config);
            });
        };
        get_video_access_authentication();
        get_user_list();
        $scope.show_add_modal = function () {
            $scope.operate_type = 'add';
            $scope.add_user_name = '';
            $scope.add_password = '';
            $scope.add_role = 'user';
            $scope.add_user_msg = '';
            $scope.add_title = '添加用户';
            $('#user_modal').modal();
        };
        $scope.show_edit_modal = function (item) {
            $scope.operate_type = 'edit';
            $scope.add_user_name = item.username;
            $scope.add_password = '';
            $scope.add_role = item.role;
            $scope.add_user_msg = '';
            $scope.add_title = '编辑用户';
            $('#user_modal').modal();
        };
        $scope.show_delete_modal = function (item) {
            $scope.operate_type = 'delete';
            $scope.current_user = item.username;
            $('#confirm_modal').modal();
        };
        $scope.add_or_edit_user = function (e) {
            var $btn, http_type, postData, reg;
            reg = /^\w-+|$/;
            if ($scope.add_user_name === '') {
                return $scope.add_user_msg = '请输入用户名';
            } else if ($scope.add_user_name.length > 16 || !reg.test($scope.add_user_name)) {
                return $scope.add_user_msg = '用户名格式错误';
            }
            if ($scope.operate_type === 'add') {
                if ($scope.add_password === '') {
                    return $scope.add_user_msg = '请输入密码';
                } else if ($scope.add_password.length > 16) {
                    return $scope.add_user_msg = '密码长度不能超过16个字符';
                }
            }
            if ($scope.add_role === '') {
                return $scope.add_user_msg = '请选择角色';
            }
            if ($scope.operate_type === 'add') {
                http_type = 'post';
                postData = {
                    username: $scope.add_user_name,
                    password: $scope.add_password,
                    role: $scope.add_role
                };
            } else {
                http_type = 'put';
                postData = {
                    username: $scope.add_user_name,
                    role: $scope.add_role
                };
                if ($scope.add_password) {
                    postData.password = $scope.add_password;
                }
            }
            $btn = $(e.target);
            $btn.button('loading');
            return $http[http_type]("" + $scope.$parent.url + "/users.json", {
                items: [postData]
            }).success(function (result) {
                $btn.button('reset');
                if (result.items && result.items.length !== 0) {
                    $('#user_modal').modal('hide');
                    $scope.$parent.show_msg('alert-success', '操作成功');
                    return get_user_list();
                } else {
                    $('#user_modal').modal('hide');
                    return $scope.$parent.show_msg('alert-danger', '操作失败');
                }
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                if (status === 401) {
                    return location.href = '/login';
                } else {
                    $('#user_modal').modal('hide');
                    return $scope.$parent.show_msg('alert-danger', '操作失败');
                }
            });
        };
        $scope.delete_user = function (e) {
            var $btn;
            $btn = $(e.target);
            $btn.button('loading');
            return $.ajax({
                url: "" + $scope.$parent.url + "/users.json",
                type: 'DELETE',
                data: JSON.stringify({
                    items: [{
                        username: $scope.current_user
                    }]
                }),
                headers: {
                    'Set-Cookie': 'token=' + getCookie('token')
                },
                success: function (data) {
                    $btn.button('reset');
                    $('#confirm_modal').modal('hide');
                    $scope.$parent.show_msg('alert-success', '删除成功');
                    return get_user_list();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    $btn.button('reset');
                    if (jqXHR.status === 401) {
                        return location.href = '/login';
                    } else {
                        $('#confirm_modal').modal('hide');
                        return $scope.$parent.show_msg('alert-danger', '删除失败');
                    }
                }
            });
        };
        return $scope.save = function (e) {
            var $btn;
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/misc.json", {
                items: {
                    rtsp_auth: $scope.rtsp_auth
                }
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('DateTimeController', [
    '$scope', '$http',
    function ($scope, $http) {
        var add_watch, valid;
        $http.get("" + $scope.$parent.url + "/datetime.json", {
            params: {
                'items[]': ['timezone', 'use_ntp', 'ntp_server', 'datetime'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            var d, local_date;
            $scope.timezone_list = [{
                value: "DatelineStandardTime12",
                text: "(UTC-12:00)国际日期变更线西"
            }, {
                value: "<UTC-11>11",
                text: "(UTC-11:00)协调世界时-11"
            }, {
                value: "SamoaStandardTime11",
                text: "(UTC-11:00)萨摩亚群岛"
            }, {
                value: "HawaiianStandardTime10",
                text: "(UTC-10:00)夏威夷"
            }, {
                value: "AlaskanStandardTime9",
                text: "(UTC-09:00)阿拉斯加"
            }, {
                value: "PacificStandardTime(Mexico)8",
                text: "(UTC-08:00)下加利福尼亚州"
            }, {
                value: "PacificStandardTime8",
                text: "(UTC-08:00)太平洋时间(美国和加拿大)"
            }, {
                value: "USMountainStandardTime7",
                text: "(UTC-07:00)亚利桑那"
            }, {
                value: "MountainStandardTime(Mexico)7",
                text: "(UTC-07:00)奇瓦瓦，拉巴斯，马萨特兰"
            }, {
                value: "MountainStandardTime7",
                text: "(UTC-07:00)山地时间(美国和加拿大)"
            }, {
                value: "CentralAmericaStandardTime6",
                text: "(UTC-06:00)中美洲"
            }, {
                value: "CentralStandardTime6",
                text: "(UTC-06:00)中部时间(美国和加拿大)"
            }, {
                value: "CentralStandardTime(Mexico)6",
                text: "(UTC-06:00)瓜达拉哈拉，墨西哥城，蒙特雷"
            }, {
                value: "CanadaCentralStandardTime6",
                text: "(UTC-06:00)萨斯喀彻温"
            }, {
                value: "EasternStandardTime5",
                text: "(UTC-05:00)东部时间(美国和加拿大)"
            }, {
                value: "USEasternStandardTime5",
                text: "(UTC-05:00)印地安那州(东部)"
            }, {
                value: "SAPacificStandardTime5",
                text: "(UTC-05:00)波哥大，利马，基多"
            }, {
                value: "VenezuelaStandardTime4:-30",
                text: "(UTC-04:30)加拉加斯"
            }, {
                value: "SAWesternStandardTime4",
                text: "(UTC-04:00)乔治敦，拉巴斯，马瑙斯，圣胡安"
            }, {
                value: "ParaguayStandardTime4",
                text: "(UTC-04:00)亚松森"
            }, {
                value: "PacificSAStandardTime4",
                text: "(UTC-04:00)圣地亚哥"
            }, {
                value: "AtlanticStandardTime4",
                text: "(UTC-04:00)大西洋时间(加拿大)"
            }, {
                value: "CentralBrazilianStandardTime4",
                text: "(UTC-04:00)库亚巴"
            }, {
                value: "NewfoundlandStandardTime3:-30",
                text: "(UTC-03:30)纽芬兰"
            }, {
                value: "SAEasternStandardTime3",
                text: "(UTC-03:00)卡宴，福塔雷萨"
            }, {
                value: "ESouthAmericaStandardTime3",
                text: "(UTC-03:00)巴西利亚"
            }, {
                value: "ArgentinaStandardTime3",
                text: "(UTC-03:00)布宜诺斯艾利斯"
            }, {
                value: "GreenlandStandardTime3",
                text: "(UTC-03:00)格陵兰"
            }, {
                value: "MontevideoStandardTime3",
                text: "(UTC-03:00)蒙得维的亚"
            }, {
                value: "Mid-AtlanticStandardTime2",
                text: "(UTC-02:00)中大西洋"
            }, {
                value: "<UTC-02>2",
                text: "(UTC-02:00)协调世界时-02"
            }, {
                value: "AzoresStandardTime1",
                text: "(UTC-01:00)亚速尔群岛"
            }, {
                value: "CapeVerdeStandardTime1",
                text: "(UTC-01:00)佛得角群岛"
            }, {
                value: "<UTC>0",
                text: "(UTC)协调世界时"
            }, {
                value: "MoroccoStandardTime0",
                text: "(UTC)卡萨布兰卡"
            }, {
                value: "GreenwichStandardTime0",
                text: "(UTC)蒙罗维亚，雷克雅未克"
            }, {
                value: "GMTStandardTime0",
                text: "(UTC)都柏林，爱丁堡，里斯本，伦敦"
            }, {
                value: "WCentralAfricaStandardTime-1",
                text: "(UTC+01:00)中非西部"
            }, {
                value: "RomanceStandardTime-1",
                text: "(UTC+01:00)布鲁塞尔，哥本哈根，马德里，巴黎"
            }, {
                value: "NamibiaStandardTime-1",
                text: "(UTC+01:00)温得和克"
            }, {
                value: "CentralEuropeanStandardTime-1",
                text: "(UTC+01:00)萨拉热窝，斯科普里，华沙，萨格勒布"
            }, {
                value: "CentralEuropeStandardTime-1",
                text: "(UTC+01:00)贝尔格莱德，布拉迪斯拉发，布达佩斯，卢布尔雅那，布拉格"
            }, {
                value: "WEuropeStandardTime-1",
                text: "(UTC+01:00)阿姆斯特丹，柏林，伯尔尼，罗马，斯德哥尔摩，维也纳"
            }, {
                value: "SouthAfricaStandardTime-2",
                text: "(UTC+02:00)哈拉雷，比勒陀利亚"
            }, {
                value: "SyriaStandardTime-2",
                text: "(UTC+02:00)大马士革"
            }, {
                value: "JordanStandardTime-2",
                text: "(UTC+02:00)安曼"
            }, {
                value: "EgyptStandardTime-2",
                text: "(UTC+02:00)开罗"
            }, {
                value: "EEuropeStandardTime-2",
                text: "(UTC+02:00)明斯克"
            }, {
                value: "IsraelStandardTime-2",
                text: "(UTC+02:00)耶路撒冷"
            }, {
                value: "MiddleEastStandardTime-2",
                text: "(UTC+02:00)贝鲁特"
            }, {
                value: "FLEStandardTime-2",
                text: "(UTC+02:00)赫尔辛基，基辅，里加，索非亚，塔林，维尔纽斯"
            }, {
                value: "GTBStandardTime-2",
                text: "(UTC+02:00)雅典，布加勒斯特，伊斯坦布尔"
            }, {
                value: "EAfricaStandardTime-3",
                text: "(UTC+03:00)内罗毕"
            }, {
                value: "ArabicStandardTime-3",
                text: "(UTC+03:00)巴格达"
            }, {
                value: "ArabStandardTime-3",
                text: "(UTC+03:00)科威特，利雅得"
            }, {
                value: "RussianStandardTime-3",
                text: "(UTC+03:00)莫斯科，圣彼得堡，伏尔加格勒"
            }, {
                value: "IranStandardTime-3:30",
                text: "(UTC+03:30)德黑兰"
            }, {
                value: "CaucasusStandardTime-4",
                text: "(UTC+04:00)埃里温"
            }, {
                value: "AzerbaijanStandardTime-4",
                text: "(UTC+04:00)巴库"
            }, {
                value: "GeorgianStandardTime-4",
                text: "(UTC+04:00)第比利斯"
            }, {
                value: "MauritiusStandardTime-4",
                text: "(UTC+04:00)路易港"
            }, {
                value: "ArabianStandardTime-4",
                text: "(UTC+04:00)阿布扎比，马斯喀特"
            }, {
                value: "AfghanistanStandardTime-4:30",
                text: "(UTC+04:30)喀布尔"
            }, {
                value: "PakistanStandardTime-5",
                text: "(UTC+05:00)伊斯兰堡，卡拉奇"
            }, {
                value: "EkaterinburgStandardTime-5",
                text: "(UTC+05:00)叶卡捷琳堡"
            }, {
                value: "WestAsiaStandardTime-5",
                text: "(UTC+05:00)塔什干"
            }, {
                value: "SriLankaStandardTime-5:30",
                text: "(UTC+05:30)斯里加亚渥登普拉"
            }, {
                value: "IndiaStandardTime-5:30",
                text: "(UTC+05:30)钦奈，加尔各答，孟买，新德里"
            }, {
                value: "NepalStandardTime-5:45",
                text: "(UTC+05:45)加德满都"
            }, {
                value: "NCentralAsiaStandardTime-6",
                text: "(UTC+06:00)新西伯利亚"
            }, {
                value: "BangladeshStandardTime-6",
                text: "(UTC+06:00)达卡"
            }, {
                value: "CentralAsiaStandardTime-6",
                text: "(UTC+06:00)阿斯塔纳"
            }, {
                value: "MyanmarStandardTime-6:30",
                text: "(UTC+06:30)仰光"
            }, {
                value: "NorthAsiaStandardTime-7",
                text: "(UTC+07:00)克拉斯诺亚尔斯克"
            }, {
                value: "SEAsiaStandardTime-7",
                text: "(UTC+07:00)曼谷，河内，雅加达"
            }, {
                value: "UlaanbaatarStandardTime-8",
                text: "(UTC+08:00)乌兰巴托"
            }, {
                value: "NorthAsiaEastStandardTime-8",
                text: "(UTC+08:00)伊尔库茨克"
            }, {
                value: "ChinaStandardTime-8",
                text: "(UTC+08:00)北京，重庆，香港特别行政区，乌鲁木齐"
            }, {
                value: "TaipeiStandardTime-8",
                text: "(UTC+08:00)台北"
            }, {
                value: "SingaporeStandardTime-8",
                text: "(UTC+08:00)吉隆坡，新加坡"
            }, {
                value: "WAustraliaStandardTime-8",
                text: "(UTC+08:00)珀斯"
            }, {
                value: "TokyoStandardTime-9",
                text: "(UTC+09:00)大阪，札幌，东京"
            }, {
                value: "YakutskStandardTime-9",
                text: "(UTC+09:00)雅库茨克"
            }, {
                value: "KoreaStandardTime-9",
                text: "(UTC+09:00)首尔"
            }, {
                value: "AUSCentralStandardTime-9:30",
                text: "(UTC+09:30)达尔文"
            }, {
                value: "CenAustraliaStandardTime-9:30",
                text: "(UTC+09:30)阿德莱德"
            }, {
                value: "WestPacificStandardTime-10",
                text: "(UTC+10:00)关岛，莫尔兹比港"
            }, {
                value: "AUSEasternStandardTime-10",
                text: "(UTC+10:00)堪培拉，墨尔本，悉尼"
            }, {
                value: "EAustraliaStandardTime-10",
                text: "(UTC+10:00)布里斯班"
            }, {
                value: "VladivostokStandardTime-10",
                text: "(UTC+10:00)符拉迪沃斯托克"
            }, {
                value: "TasmaniaStandardTime-10",
                text: "(UTC+10:00)霍巴特"
            }, {
                value: "CentralPacificStandardTime-11",
                text: "(UTC+11:00)所罗门群岛，新喀里多尼亚"
            }, {
                value: "MagadanStandardTime-11",
                text: "(UTC+11:00)马加丹"
            }, {
                value: "<UTC+12>-12",
                text: "(UTC+12:00)协调世界时+12"
            }, {
                value: "NewZealandStandardTime-12",
                text: "(UTC+12:00)奥克兰，惠灵顿"
            }, {
                value: "KamchatkaStandardTime-12",
                text: "(UTC+12:00)彼得罗巴甫洛夫斯克-堪察加 - 旧用"
            }, {
                value: "FijiStandardTime-12",
                text: "(UTC+12:00)斐济"
            }, {
                value: "TongaStandardTime-13",
                text: "(UTC+13:00)努库阿洛法"
            }];
            $scope.timezone = data.items.timezone;
            $scope.datetime_type = data.items.use_ntp ? '2' : '1';
            d = new Date(data.items.datetime.replace(/-/g, '/'));
            local_date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
            $scope.datetime = dateFormat(local_date, 'yyyy-MM-dd hh:mm:ss');
            $scope.ntp_server = data.items.ntp_server;
            $('[name=datetime_type][value=' + $scope.datetime_type + ']').iCheck('check');
            return add_watch();
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        $scope.datetime_msg = '';
        $scope.ntp_server_msg = '';
        valid = function (msg_name, value, name) {
            if (!value) {
                return $scope[msg_name] = name + '不能为空';
            } else if (value.length > 32) {
                return $scope[msg_name] = name + '长度不能超过32个字符';
            } else {
                return $scope[msg_name] = '';
            }
        };
        add_watch = function () {
            $scope.$watch('datetime_type', function (newValue) {
                if ($scope.datetime_type === '1') {
                    valid('datetime_msg', $scope.datetime, '日期时间');
                    return $scope.ntp_server_msg = '';
                } else if ($scope.datetime_type === '2') {
                    valid('ntp_server_msg', $scope.ntp_server, 'NTP服务器');
                    return $scope.datetime_msg = '';
                }
            });
            $scope.$watch('datetime', function (newValue) {
                if ($scope.datetime_type === '1') {
                    return valid('datetime_msg', newValue, '日期时间');
                }
            });
            return $scope.$watch('ntp_server', function (newValue) {
                if ($scope.datetime_type === '2') {
                    return valid('ntp_server_msg', newValue, 'NTP服务器');
                }
            });
        };
        return $scope.save = function (e) {
            var $btn, d, date, hours, minutes, month, postData, seconds, use_ntp, year;
            if ($scope.datetime_msg || $scope.ntp_server_msg) {
                return;
            }
            use_ntp = $scope.datetime_type === '1' ? false : true;
            postData = {
                timezone: $scope.timezone,
                use_ntp: use_ntp
            };
            if (use_ntp) {
                postData.ntp_server = $scope.ntp_server;
            } else {
                d = new Date($scope.datetime);
                year = d.getUTCFullYear();
                month = d.getUTCMonth() + 1;
                month = month < 10 ? '0' + month : month;
                date = d.getUTCDate();
                date = date < 10 ? '0' + date : date;
                hours = d.getUTCHours();
                hours = hours < 10 ? '0' + hours : hours;
                minutes = d.getUTCMinutes();
                minutes = minutes < 10 ? '0' + minutes : minutes;
                seconds = d.getUTCSeconds();
                seconds = seconds < 10 ? '0' + seconds : seconds;
                postData.datetime = year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds;
            }
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/datetime.json", {
                items: postData
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('MaintenanceController', [
    '$scope', '$http', '$timeout',
    function ($scope, $http, $timeout) {
        var anim_timeout, get_upgrade, hide_confirm, reboot_animation, reboot_timeout, show_confirm, upgrade_animation, upgrade_timeout;
        $scope.operate_type = '';
        $scope.confirm_content = '';
        $scope.is_reboot = false;
        $scope.reboot_step = 1;
        $scope.reboot_active_index = 1;
        $scope.upgrading = false;
        $scope.step = 1;
        $scope.upload_msg = '';
        $scope.activeIndex = 1;
        reboot_timeout = null;
        upgrade_timeout = null;
        anim_timeout = null;
        show_confirm = function () {
            $('#maint_confirm_modal').modal();
        };
        hide_confirm = function () {
            $('#maint_confirm_modal').modal('hide');
        };
        $scope.soft_reset = function () {
            $scope.operate_type = 'soft_reset';
            $scope.confirm_content = '确定进行软复位吗？';
            return show_confirm();
        };
        $scope.hard_reset = function () {
            $scope.operate_type = 'hard_reset';
            $scope.confirm_content = '确定进行硬复位吗？';
            return show_confirm();
        };
        $scope.reboot = function () {
            $scope.operate_type = 'reboot';
            $scope.confirm_content = '确定重启设备吗？';
            return show_confirm();
        };
        $scope.reset_or_reboot = function (e) {
            var $btn;
            $btn = $(e.target);
            $btn.button('loading');
            return $http.post("" + $scope.$parent.url + "/system.json", {
                action: $scope.operate_type
            }).success(function (msg) {
                $btn.button('reset');
                hide_confirm();
                reboot_animation();
                $scope.is_reboot = true;
                return $timeout(function () {
                    $scope.reboot_step = 2;
                    return location.href = '/login';
                }, 30000);
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                hide_confirm();
                return $scope.$parent.error(response, status, headers, config);
            });
        };
        reboot_animation = function () {
            $timeout.cancel(reboot_timeout);
            return reboot_timeout = $timeout(function () {
                if ($scope.step === 0) {
                    return;
                }
                $scope.reboot_active_index = $scope.reboot_active_index + 1;
                if ($scope.reboot_active_index > 3) {
                    $scope.reboot_active_index = 1;
                }
                return reboot_animation();
            }, 1000);
        };
        upgrade_animation = function () {
            $timeout.cancel(anim_timeout);
            return anim_timeout = $timeout(function () {
                if ($scope.step === 0) {
                    return;
                }
                $scope.activeIndex = $scope.activeIndex + 1;
                if ($scope.activeIndex > 3) {
                    $scope.activeIndex = 1;
                }
                return upgrade_animation();
            }, 1000);
        };
        get_upgrade = function () {
            $timeout.cancel(upgrade_timeout);
            return upgrade_timeout = $timeout(function () {
                return $http.get("" + $scope.$parent.url + "/upgrade.json", {
                    params: {
                        v: new Date().getTime()
                    }
                }).success(function (data) {
                    if (data.status === 0) {
                        $scope.step = 1;
                        $scope.upgrading = false;
                        $scope.$parent.show_msg('alert-danger', '文件错误');
                        window.onbeforeunload = null;
                        $timeout.cancel(anim_timeout);
                        return;
                    }
                    $scope.step = data.status;
                    return get_upgrade();
                }).error(function (response, status, headers, config) {
                    window.onbeforeunload = null;
                    $scope.step = 4;
                    return $timeout(function () {
                        $scope.step = 5;
                        return location.href = '/login';
                    }, 30000);
                });
            }, 1000);
        };
        return $scope.upload_file = function () {
            $scope.upload_msg = '';
            if ($('#file_path').val() === '') {
                $scope.upload_msg = '请选择更新文件';
                return;
            }
            $scope.upgrading = true;
            upgrade_animation();
            window.onbeforeunload = function () {
                var returnValue;
                return returnValue = '系统正在进行升级，请等待升级完成后再进行操作！';
            };
            return $.ajaxFileUpload({
                url: "" + window.uploadUrl + "/upload.fcgi",
                secureuri: false,
                fileElementId: 'file_path',
                success: function (data, status) {
                    return get_upgrade();
                },
                error: function (data, status, e) {
                    return alert(e);
                }
            });
        };
    }
]);

ipcApp.controller('StreamController', [
    '$scope', '$http',
    function ($scope, $http) {
        var add_watch, isValid, valid;
        $http.get("" + $scope.$parent.url + "/video.json", {
            params: {
                'items[]': ['profile', 'flip', 'mirror', 'main_profile', 'sub_profile'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.profile = data.items.profile;
            $scope.flip = data.items.flip;
            $scope.mirror = data.items.mirror;
            $scope.main_profile = data.items.main_profile;
            $scope.sub_profile = data.items.sub_profile;
            return add_watch();
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        $scope.valid_msg = '';
        valid = function (name, value, min, max, msg) {
            if (value === null) {
                $scope.valid_msg = name + '不能为空';
                return false;
            } else if (value === void 0) {
                $scope.valid_msg = name + '必须为数字';
                return false;
            } else if (value < min || value > max) {
                $scope.valid_msg = name + '的范围为' + min + ' - ' + max;
                return false;
            } else {
                $scope.valid_msg = '';
                return true;
            }
        };
        add_watch = function () {
            $scope.$watch('main_profile.frame_rate', function (newValue) {
                return valid('主码流帧率', newValue, 1, 30);
            });
            $scope.$watch('main_profile.bit_rate_value', function (newValue) {
                return valid('主码流码率', newValue, 128, 10240);
            });
            $scope.$watch('sub_profile.frame_rate', function (newValue) {
                return valid('次码流帧率', newValue, 1, 30);
            });
            return $scope.$watch('sub_profile.bit_rate_value', function (newValue) {
                return valid('次码流码率', newValue, 128, 10240);
            });
        };
        isValid = function () {
            if (valid('主码流帧率', $scope.main_profile.frame_rate, 1, 30) && valid('主码流码率', $scope.main_profile.bit_rate_value, 128, 10240) && valid('次码流帧率', $scope.sub_profile.frame_rate, 1, 30) && valid('次码流码率', $scope.sub_profile.bit_rate_value, 128, 10240)) {
                return true;
            } else {
                return false;
            }
        };
        return $scope.save = function (e) {
            var $btn;
            if (!isValid()) {
                return;
            }
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/video.json", {
                items: {
                    profile: $scope.profile,
                    flip: $scope.flip,
                    mirror: $scope.mirror,
                    main_profile: {
                        resolution: $scope.main_profile.resolution,
                        frame_rate: $scope.main_profile.frame_rate,
                        bit_rate: $scope.main_profile.bit_rate,
                        bit_rate_value: $scope.main_profile.bit_rate_value
                    },
                    sub_profile: {
                        resolution: $scope.sub_profile.resolution,
                        frame_rate: $scope.sub_profile.frame_rate,
                        bit_rate: $scope.sub_profile.bit_rate,
                        bit_rate_value: $scope.sub_profile.bit_rate_value
                    }
                }
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('ImageController', [
    '$scope', '$http',
    function ($scope, $http) {
        var add_watch;
        $http.get("" + $scope.$parent.url + "/image.json", {
            params: {
                'items[]': ['watermark', '3ddnr', 'brightness', 'chrominance', 'contrast', 'saturation', 'scenario'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.watermark = data.items.watermark;
            $scope.dnr = data.items['3ddnr'];
            $scope.brightness = data.items.brightness;
            $scope.chrominance = data.items.chrominance;
            $scope.contrast = data.items.contrast;
            $scope.saturation = data.items.saturation;
            $scope.scenario = data.items.scenario;
            $('#brightness_slider').val($scope.brightness);
            $('#chrominance_slider').val($scope.chrominance);
            $('#contrast_slider').val($scope.contrast);
            $('#saturation_slider').val($scope.saturation);
            $('[name=scenario][value=' + $scope.scenario + ']').iCheck('check');
            return add_watch();
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        playVlc();
        return add_watch = function () {
            $scope.$watch('watermark', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    return $http.put("" + $scope.$parent.url + "/image.json", {
                        items: {
                            watermark: $scope.watermark
                        }
                    }).error(function (response, status, headers, config) {
                        return $scope.$parent.error(response, status, headers, config);
                    });
                }
            });
            $scope.$watch('dnr', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    return $http.put("" + $scope.$parent.url + "/image.json", {
                        items: {
                            '3ddnr': $scope.dnr
                        }
                    }).error(function (response, status, headers, config) {
                        return $scope.$parent.error(response, status, headers, config);
                    });
                }
            });
            $('#brightness_slider').on('change', function () {
                return $http.put("" + $scope.$parent.url + "/image.json", {
                    items: {
                        brightness: $scope.brightness
                    }
                }).error(function (response, status, headers, config) {
                    return $scope.$parent.error(response, status, headers, config);
                });
            });
            $('#chrominance_slider').on('change', function () {
                return $http.put("" + $scope.$parent.url + "/image.json", {
                    items: {
                        chrominance: $scope.chrominance
                    }
                }).error(function (response, status, headers, config) {
                    return $scope.$parent.error(response, status, headers, config);
                });
            });
            $('#contrast_slider').on('change', function () {
                return $http.put("" + $scope.$parent.url + "/image.json", {
                    items: {
                        contrast: $scope.contrast
                    }
                }).error(function (response, status, headers, config) {
                    return $scope.$parent.error(response, status, headers, config);
                });
            });
            $('#saturation_slider').on('change', function () {
                return $http.put("" + $scope.$parent.url + "/image.json", {
                    items: {
                        saturation: $scope.saturation
                    }
                }).error(function (response, status, headers, config) {
                    return $scope.$parent.error(response, status, headers, config);
                });
            });
            return $scope.$watch('scenario', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    return $http.put("" + $scope.$parent.url + "/image.json", {
                        items: {
                            scenario: $scope.scenario
                        }
                    }).error(function (response, status, headers, config) {
                        return $scope.$parent.error(response, status, headers, config);
                    });
                }
            });
        };
    }
]);

ipcApp.controller('PrivacyBlockController', [
    '$scope', '$http',
    function ($scope, $http) {
        var add_watch;
        $http.get("" + $scope.$parent.url + "/privacy_block.json", {
            params: {
                'items[]': ['region1', 'region2'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.region1 = data.items.region1;
            $scope.region2 = data.items.region2;
            $scope.region1_rect = {
                left: Math.round($scope.region1.rect.left / 1000 * VIDEO_WIDTH),
                top: Math.round($scope.region1.rect.top / 1000 * VIDEO_HEIGHT),
                width: Math.round($scope.region1.rect.width / 1000 * VIDEO_WIDTH),
                height: Math.round($scope.region1.rect.height / 1000 * VIDEO_HEIGHT)
            };
            $scope.region2_rect = {
                left: Math.round($scope.region2.rect.left / 1000 * VIDEO_WIDTH),
                top: Math.round($scope.region2.rect.top / 1000 * VIDEO_HEIGHT),
                width: Math.round($scope.region2.rect.width / 1000 * VIDEO_WIDTH),
                height: Math.round($scope.region2.rect.height / 1000 * VIDEO_HEIGHT)
            };
            $scope.current_region = 'region1';
            return add_watch();
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        playVlc();
        add_watch = function () {
            $scope.$watch('region1.color', function (newValue) {
                var hex;
                if (newValue) {
                    hex = '#' + ((1 << 24) | (parseInt(newValue.red) << 16) | (parseInt(newValue.green) << 8) | parseInt(newValue.blue)).toString(16).substr(1);
                    return $scope.region1_color_hex = hex.toUpperCase();
                }
            });
            return $scope.$watch('region2.color', function (newValue) {
                var hex;
                if (newValue) {
                    hex = '#' + ((1 << 24) | (parseInt(newValue.red) << 16) | (parseInt(newValue.green) << 8) | parseInt(newValue.blue)).toString(16).substr(1);
                    return $scope.region2_color_hex = hex.toUpperCase();
                }
            });
        };
        return $scope.save = function (e) {
            var $btn;
            $scope.region1.rect = {
                left: Math.round($scope.region1_rect.left / VIDEO_WIDTH * 1000),
                top: Math.round($scope.region1_rect.top / VIDEO_HEIGHT * 1000),
                width: Math.round($scope.region1_rect.width / VIDEO_WIDTH * 1000),
                height: Math.round($scope.region1_rect.height / VIDEO_HEIGHT * 1000)
            };
            $scope.region2.rect = {
                left: Math.round($scope.region2_rect.left / VIDEO_WIDTH * 1000),
                top: Math.round($scope.region2_rect.top / VIDEO_HEIGHT * 1000),
                width: Math.round($scope.region2_rect.width / VIDEO_WIDTH * 1000),
                height: Math.round($scope.region2_rect.height / VIDEO_HEIGHT * 1000)
            };
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/privacy_block.json", {
                items: {
                    region1: $scope.region1,
                    region2: $scope.region2
                }
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('DayNightModeController', [
    '$scope', '$http',
    function ($scope, $http) {
        $http.get("" + $scope.$parent.url + "/day_night_mode.json", {
            params: {
                'items[]': ['night_mode_threshold', 'ir_intensity'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.night_mode_threshold = data.items.night_mode_threshold;
            $scope.ir_intensity = data.items.ir_intensity;
            $('#night_mode_threshold_slider').val($scope.night_mode_threshold);
            return $('#ir_intensity_slider').val($scope.ir_intensity);
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        return $scope.save = function (e) {
            var $btn;
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/day_night_mode.json", {
                items: {
                    night_mode_threshold: $scope.night_mode_threshold,
                    ir_intensity: $scope.ir_intensity
                }
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('OsdController', [
    '$scope', '$http',
    function ($scope, $http) {
        var add_watch, getOsdInfo, isValid, master_params, obj, slave_params, valid_font_size, valid_left_or_top;
        getOsdInfo = function (name, params) {
            return $.ajax({
                url: "" + $scope.$parent.url + "/osd.json",
                data: {
                    items: params
                },
                headers: {
                    'Set-Cookie': 'token=' + getCookie('token')
                },
                success: function (data) {
                    $scope.device_name = data.items[name].device_name;
                    $scope.device_name.left = ($scope.device_name.left / 10).toFixed(1);
                    $scope.device_name.top = ($scope.device_name.top / 10).toFixed(1);
                    $scope.comment = data.items[name].comment;
                    $scope.comment.left = ($scope.comment.left / 10).toFixed(1);
                    $scope.comment.top = ($scope.comment.top / 10).toFixed(1);
                    $scope.frame_rate = data.items[name].frame_rate;
                    $scope.frame_rate.left = ($scope.frame_rate.left / 10).toFixed(1);
                    $scope.frame_rate.top = ($scope.frame_rate.top / 10).toFixed(1);
                    $scope.bit_rate = data.items[name].bit_rate;
                    $scope.bit_rate.left = ($scope.bit_rate.left / 10).toFixed(1);
                    $scope.bit_rate.top = ($scope.bit_rate.top / 10).toFixed(1);
                    $scope.datetime = data.items[name].datetime;
                    $scope.datetime.left = ($scope.datetime.left / 10).toFixed(1);
                    $scope.datetime.top = ($scope.datetime.top / 10).toFixed(1);
                    add_watch();
                    return $scope.$apply();
                }
            });
        };
        master_params = {
            master: ['datetime', 'device_name', 'comment', 'frame_rate', 'bit_rate']
        };
        slave_params = {
            slave: ['datetime', 'device_name', 'comment', 'frame_rate', 'bit_rate']
        };
        getOsdInfo('master', master_params);
        $scope.osd_type = 0;
        $scope.valid_msg = '';
        $scope.changeOsd = function (type) {
            $scope.osd_type = type;
            if (type === 0) {
                return getOsdInfo('master', master_params);
            } else {
                return getOsdInfo('slave', slave_params);
            }
        };
        obj = {
            'device_name': '【设备名称】',
            'comment': '【设备说明】',
            'frame_rate': '【帧率】',
            'bit_rate': '【码率】',
            'datetime': '【日期时间】'
        };
        add_watch = function () {
            var name, _results;
            _results = [];
            for (name in obj) {
                $scope.$watch("" + name + ".size", function (newValue) {
                    return valid_font_size(obj[this.exp.split('.size')[0]], '字号', newValue);
                });
                $scope.$watch("" + name + ".left", function (newValue) {
                    return valid_left_or_top(obj[this.exp.split('.left')[0]], '左边距', newValue);
                });
                _results.push($scope.$watch("" + name + ".top", function (newValue) {
                    return valid_left_or_top(obj[this.exp.split('.top')[0]], '上边距', newValue);
                }));
            }
            return _results;
        };
        valid_font_size = function (name, field, value) {
            if (value === null) {
                $scope.valid_msg = name + field + '不能为空';
                return false;
            } else if (value === void 0) {
                $scope.valid_msg = name + field + '必须为数字';
                return false;
            } else if (value < 1 || value > 100) {
                $scope.valid_msg = name + field + '的范围为1 - 100';
                return false;
            } else {
                $scope.valid_msg = '';
                return true;
            }
        };
        valid_left_or_top = function (name, field, value) {
            if (!value) {
                $scope.valid_msg = name + field + '不能为空';
                return false;
            } else if (isNaN(value)) {
                $scope.valid_msg = name + field + '必须为数字';
                return false;
            } else if (parseFloat(value) < 1 || parseFloat(value) > 100) {
                $scope.valid_msg = name + field + '的范围为 1.0% - 100.0%';
                return false;
            } else {
                $scope.valid_msg = '';
                return true;
            }
        };
        isValid = function () {
            var name;
            for (name in obj) {
                if (!valid_font_size(obj[name], '字号', $scope[name].size)) {
                    return false;
                } else if (!valid_left_or_top(obj[name], '左边距', $scope[name].left)) {
                    return false;
                } else if (!valid_left_or_top(obj[name], '上边距', $scope[name].top)) {
                    return false;
                }
            }
            return true;
        };
        return $scope.save = function (e) {
            var $btn, data, postData;
            if (!isValid()) {
                return;
            }
            postData = {
                device_name: $.extend({}, $scope.device_name),
                comment: $.extend({}, $scope.comment),
                frame_rate: $.extend({}, $scope.frame_rate),
                bit_rate: $.extend({}, $scope.bit_rate),
                datetime: $.extend({}, $scope.datetime)
            };
            postData.device_name.left = parseFloat($scope.device_name.left) * 10;
            postData.device_name.top = parseFloat($scope.device_name.top) * 10;
            postData.comment.left = parseFloat($scope.comment.left) * 10;
            postData.comment.top = parseFloat($scope.comment.top) * 10;
            postData.frame_rate.left = parseFloat($scope.frame_rate.left) * 10;
            postData.frame_rate.top = parseFloat($scope.frame_rate.top) * 10;
            postData.bit_rate.left = parseFloat($scope.bit_rate.left) * 10;
            postData.bit_rate.top = parseFloat($scope.bit_rate.top) * 10;
            postData.datetime.left = parseFloat($scope.datetime.left) * 10;
            postData.datetime.top = parseFloat($scope.datetime.top) * 10;
            if ($scope.osd_type === 0) {
                data = {
                    master: postData
                };
            } else {
                data = {
                    slave: postData
                };
            }
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/osd.json", {
                items: data
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('SzycController', [
    '$scope', '$http',
    function ($scope, $http) {
        var add_watch, position_num_reg, train_num_reg, valid;
        $http.get("" + $scope.$parent.url + "/szyc.json", {
            params: {
                'items[]': ['train_num', 'position_num'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.train_num = data.items.train_num;
            $scope.position_num = data.items.position_num;
            return add_watch();
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        $scope.train_num_msg = '';
        $scope.position_num_msg = '';
        train_num_reg = /^[0-9]{6}$/;
        position_num_reg = /^[1-8]{1}$/;
        valid = {
            train_num: function (value) {
                if (!train_num_reg.test(value)) {
                    $scope.train_num_msg = '请输入正确的车体号';
                    return false;
                } else {
                    $scope.train_num_msg = '';
                    return true;
                }
            },
            position_num: function (value) {
                if (!position_num_reg.test(value)) {
                    $scope.position_num_msg = '请输入正确的位置';
                    return false;
                } else {
                    $scope.position_num_msg = '';
                    return true;
                }
            }
        };
        add_watch = function () {
            $scope.$watch('train_num', function (newValue) {
                return valid.train_num(newValue);
            });
            return $scope.$watch('position_num', function (newValue) {
                return valid.position_num(newValue);
            });
        };
        return $scope.save = function (e) {
            var $btn;
            if (!valid.train_num($scope.train_num) || !valid.position_num($scope.position_num)) {
                return;
            }
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/szyc.json", {
                items: {
                    train_num: $scope.train_num,
                    position_num: $scope.position_num
                }
            }).success(function () {
                var ipAddr;
                $btn.button('reset');
                $scope.$parent.success('保存成功');
                ipAddr = location.hostname;
                return window.location = "//192.168." + (ipAddr.split('.')[2]) + "." + (parseInt($scope.position_num) + 70) + "/login";
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('InterfaceController', [
    '$scope', '$http',
    function ($scope, $http) {
        var add_watch, ip_reg, isValid, valid;
        $http.get("" + $scope.$parent.url + "/network.json", {
            params: {
                'items[]': ['method', 'address', 'pppoe', 'port'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.method = data.items.method;
            $scope.network_username = data.items.pppoe.username;
            $scope.network_password = data.items.pppoe.password;
            $scope.network_address = data.items.address.ipaddr;
            $scope.network_netmask = data.items.address.netmask;
            $scope.network_gateway = data.items.address.gateway;
            $scope.network_primary_dns = data.items.address.dns1;
            $scope.network_second_dns = data.items.address.dns2;
            $scope.http_port = data.items.port.http;
            return add_watch();
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        $scope.network_username_msg = '';
        $scope.network_password_msg = '';
        $scope.network_address_msg = '';
        $scope.network_netmask_msg = '';
        $scope.network_gateway_msg = '';
        $scope.network_primary_dns_msg = '';
        $scope.network_second_dns_ms = '';
        ip_reg = /^(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])$/;
        valid = {
            common: function (name, value, msg) {
                if (value && !ip_reg.test(value)) {
                    $scope[name] = '请输入正确的' + msg;
                    return false;
                } else {
                    $scope[name] = '';
                    return true;
                }
            },
            common_required: function (name, value, msg) {
                if (!ip_reg.test(value)) {
                    $scope[name] = '请输入正确的' + msg;
                    return false;
                } else {
                    $scope[name] = '';
                    return true;
                }
            },
            network_username: function (value) {
                if (!value) {
                    $scope.network_username_msg = '请输入用户名';
                    return false;
                } else {
                    $scope.network_username_msg = '';
                    return true;
                }
            },
            network_password: function (value) {
                if (!value) {
                    $scope.network_password_msg = '请输入密码';
                    return false;
                } else {
                    $scope.network_password_msg = '';
                    return true;
                }
            },
            network_address: function (value) {
                return this.common_required('network_address_msg', value, 'IP地址');
            },
            network_netmask: function (value) {
                return this.common_required('network_netmask_msg', value, '子网掩码');
            },
            network_gateway: function (value) {
                return this.common('network_gateway_msg', value, '网关地址');
            },
            network_primary_dns: function (value) {
                return this.common('network_primary_dns_msg', value, '主DNS');
            },
            network_second_dns: function (value) {
                return this.common('network_second_dns_msg', value, '次DNS');
            }
        };
        add_watch = function () {
            $scope.$watch('method', function (newValue) {
                $scope.network_username_msg = '';
                $scope.network_password_msg = '';
                $scope.network_address_msg = '';
                $scope.network_netmask_msg = '';
                $scope.network_gateway_msg = '';
                $scope.network_primary_dns_msg = '';
                return $scope.network_second_dns_msg = '';
            });
            $scope.$watch('network_username', function (newValue) {
                return valid.network_username(newValue);
            });
            $scope.$watch('network_password', function (newValue) {
                return valid.network_password(newValue);
            });
            $scope.$watch('network_address', function (newValue) {
                return valid.network_address(newValue);
            });
            $scope.$watch('network_netmask', function (newValue) {
                return valid.network_netmask(newValue);
            });
            $scope.$watch('network_gateway', function (newValue) {
                return valid.network_gateway(newValue);
            });
            $scope.$watch('network_primary_dns', function (newValue) {
                return valid.network_primary_dns(newValue);
            });
            return $scope.$watch('network_second_dns', function (newValue) {
                return valid.network_second_dns(newValue);
            });
        };
        isValid = function () {
            if ($scope.method === 'static') {
                if (!valid.network_address($scope.network_address) || !valid.network_netmask($scope.network_netmask) || !valid.network_gateway($scope.network_gateway) || !valid.network_primary_dns($scope.network_primary_dns) || !valid.network_second_dns($scope.network_second_dns)) {
                    return false;
                }
                return true;
            } else if ($scope.method === 'dhcp') {
                return true;
            } else if ($scope.method === 'pppoe') {
                if (!valid.network_username($scope.network_username) || !valid.network_password($scope.network_password)) {
                    return false;
                }
                return true;
            }
            return true;
        };
        $scope.canShow = function () {
            return $scope.method === 'pppoe';
        };
        $scope.canEdit = function () {
            return $scope.method !== 'static';
        };
        return $scope.save = function (e) {
            var $btn, postData;
            if (!isValid()) {
                return;
            }
            postData = {
                method: $scope.method
            };
            if (postData.method === 'static') {
                postData.address = {
                    ipaddr: $scope.network_address,
                    netmask: $scope.network_netmask,
                    gateway: $scope.network_gateway,
                    dns1: $scope.network_primary_dns,
                    dns2: $scope.network_second_dns
                };
            } else if (postData.method === 'pppoe') {
                postData.pppoe = {
                    username: $scope.network_username,
                    password: $scope.network_password
                };
            }
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/network.json", {
                items: postData
            }).success(function () {
                $btn.button('reset');
                $scope.$parent.success('保存成功');
                if (postData.method === 'static') {
                    return location.href = 'http://' + postData.address.ipaddr + ($scope.http_port === 80 ? '' : ':' + $scope.http_port);
                }
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('PortController', [
    '$scope', '$http',
    function ($scope, $http) {
        var add_watch, isValid, number_reg, valid;
        $http.get("" + $scope.$parent.url + "/network.json", {
            params: {
                'items[]': ['port'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.http_port = data.items.port.http;
            $scope.ftp_port = data.items.port.ftp;
            $scope.rtsp_port = data.items.port.rtsp;
            return add_watch();
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        $scope.http_port_msg = '';
        $scope.ftp_port_msg = '';
        $scope.rtsp_port_msg = '';
        $scope.common_msg = '';
        number_reg = /^[0-9]*$/;
        valid = {
            common: function (name, value, msg) {
                if (!value) {
                    $scope[name] = '请输入' + msg + '端口';
                    return false;
                } else if (!number_reg.test(value)) {
                    $scope[name] = '请输入正确的' + msg + '端口';
                    return false;
                } else {
                    $scope[name] = '';
                    return true;
                }
            },
            http_port: function (value) {
                return this.common('http_port_msg', value, 'HTTP');
            },
            ftp_port: function (value) {
                return this.common('ftp_port_msg', value, 'FTP');
            },
            rtsp_port: function (value) {
                return this.common('rtsp_port_msg', value, 'RTSP');
            }
        };
        add_watch = function () {
            $scope.$watch('http_port', function (newValue) {
                return valid.http_port(newValue);
            });
            $scope.$watch('ftp_port', function (newValue) {
                return valid.ftp_port(newValue);
            });
            return $scope.$watch('rtsp_port', function (newValue) {
                return valid.rtsp_port(newValue);
            });
        };
        isValid = function () {
            if (!valid.http_port($scope.http_port) || !valid.ftp_port($scope.ftp_port) || !valid.rtsp_port($scope.rtsp_port)) {
                return false;
            }
            if ($scope.http_port === $scope.ftp_port || $scope.http_port === $scope.rtsp_port || $scope.ftp_port === $scope.rtsp_port) {
                $scope.common_msg = '端口不能相同';
                return false;
            }
            $scope.common_msg = '';
            return true;
        };
        return $scope.save = function (e) {
            var $btn;
            if (!isValid()) {
                return;
            }
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/network.json", {
                items: {
                    port: {
                        http: parseInt($scope.http_port, 10),
                        ftp: parseInt($scope.ftp_port, 10),
                        rtsp: parseInt($scope.rtsp_port, 10)
                    }
                }
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('InputController', [
    '$scope', '$http',
    function ($scope, $http) {
        $http.get("" + $scope.$parent.url + "/event_input.json", {
            params: {
                'items[]': ['input1'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.input1 = data.items.input1;
            $scope.current_input = 'input1';
            return $('#input1_schedules').timegantt('setSelected', $scope.input1.schedules);
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        return $scope.save = function (e) {
            var $btn;
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/event_input.json", {
                items: {
                    input1: $scope.input1
                }
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            });
        };
    }
]);

ipcApp.controller('OutputController', [
    '$scope', '$http',
    function ($scope, $http) {
        var add_watch, isValid, number_reg, valid;
        $http.get("" + $scope.$parent.url + "/event_output.json", {
            params: {
                'items[]': ['output1', 'output2'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.output1_normal = data.items.output1.normal === 'open' ? true : false;
            $scope.output1_trigger = data.items.output1.normal === 'close' ? false : true;
            $scope.output1_period = data.items.output1.period;
            return add_watch();
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        $scope.output1_period_msg = '';
        number_reg = /^[0-9]*$/;
        valid = {
            common: function (name, value, msg) {
                if (!value) {
                    $scope[name] = '请输入' + msg;
                    return false;
                } else if (!number_reg.test(value) || parseInt(value) < 1 || parseInt(value) > 3600) {
                    $scope[name] = '请输入正确的' + msg;
                    return false;
                } else {
                    $scope[name] = '';
                    return true;
                }
            },
            output1_period: function (value) {
                return this.common('output1_period_msg', value, '保持时间');
            }
        };
        add_watch = function () {
            $scope.$watch('output1_normal', function (newValue) {
                return $scope.output1_trigger = !newValue;
            });
            $scope.$watch('output1_trigger', function (newValue) {
                return $scope.output1_normal = !newValue;
            });
            return $scope.$watch('output1_period', function (newValue) {
                return valid.output1_period(newValue);
            });
        };
        isValid = function () {
            if (!valid.output1_period($scope.output1_period)) {
                return false;
            }
            return true;
        };
        return $scope.save = function (e) {
            var $btn;
            if (!isValid()) {
                return;
            }
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/event_output.json", {
                items: {
                    output1: {
                        normal: $scope.output1_normal === true ? 'open' : 'close',
                        period: parseInt($scope.output1_period)
                    }
                }
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('MotionDetectController', [
    '$scope', '$http',
    function ($scope, $http) {
        playVlc();
        $http.get("" + $scope.$parent.url + "/event_motion.json", {
            params: {
                'items[]': ['region1', 'region2'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.region1 = data.items.region1;
            $scope.region1_rect = {
                left: Math.round($scope.region1.rect.left / 1000 * VIDEO_WIDTH),
                top: Math.round($scope.region1.rect.top / 1000 * VIDEO_HEIGHT),
                width: Math.round($scope.region1.rect.width / 1000 * VIDEO_WIDTH),
                height: Math.round($scope.region1.rect.height / 1000 * VIDEO_HEIGHT)
            };
            $scope.region2 = data.items.region2;
            $scope.region2_rect = {
                left: Math.round($scope.region2.rect.left / 1000 * VIDEO_WIDTH),
                top: Math.round($scope.region2.rect.top / 1000 * VIDEO_HEIGHT),
                width: Math.round($scope.region2.rect.width / 1000 * VIDEO_WIDTH),
                height: Math.round($scope.region2.rect.height / 1000 * VIDEO_HEIGHT)
            };
            $scope.current_region = 'region1';
            $('#region1_sensitivity').val($scope.region1.sensitivity);
            $('#region2_sensitivity').val($scope.region2.sensitivity);
            $('#region1_schedules').timegantt('setSelected', $scope.region1.schedules);
            return $('#region2_schedules').timegantt('setSelected', $scope.region2.schedules);
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        return $scope.save = function (e) {
            var $btn;
            $scope.region1.rect = {
                left: Math.round($scope.region1_rect.left / VIDEO_WIDTH * 1000),
                top: Math.round($scope.region1_rect.top / VIDEO_HEIGHT * 1000),
                width: Math.round($scope.region1_rect.width / VIDEO_WIDTH * 1000),
                height: Math.round($scope.region1_rect.height / VIDEO_HEIGHT * 1000)
            };
            $scope.region2.rect = {
                left: Math.round($scope.region2_rect.left / VIDEO_WIDTH * 1000),
                top: Math.round($scope.region2_rect.top / VIDEO_HEIGHT * 1000),
                width: Math.round($scope.region2_rect.width / VIDEO_WIDTH * 1000),
                height: Math.round($scope.region2_rect.height / VIDEO_HEIGHT * 1000)
            };
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/event_motion.json", {
                items: {
                    region1: $scope.region1,
                    region2: $scope.region2
                }
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('VideoCoverageController', [
    '$scope', '$http',
    function ($scope, $http) {
        playVlc();
        $http.get("" + $scope.$parent.url + "/event_cover.json", {
            params: {
                'items[]': ['region1', 'region2'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.region1 = data.items.region1;
            $scope.region1_rect = {
                left: Math.round($scope.region1.rect.left / 1000 * VIDEO_WIDTH),
                top: Math.round($scope.region1.rect.top / 1000 * VIDEO_HEIGHT),
                width: Math.round($scope.region1.rect.width / 1000 * VIDEO_WIDTH),
                height: Math.round($scope.region1.rect.height / 1000 * VIDEO_HEIGHT)
            };
            $scope.region2 = data.items.region2;
            $scope.region2_rect = {
                left: Math.round($scope.region2.rect.left / 1000 * VIDEO_WIDTH),
                top: Math.round($scope.region2.rect.top / 1000 * VIDEO_HEIGHT),
                width: Math.round($scope.region2.rect.width / 1000 * VIDEO_WIDTH),
                height: Math.round($scope.region2.rect.height / 1000 * VIDEO_HEIGHT)
            };
            $scope.current_region = 'region1';
            $('#region1_sensitivity').val($scope.region1.sensitivity);
            $('#region2_sensitivity').val($scope.region2.sensitivity);
            $('#region1_schedules').timegantt('setSelected', $scope.region1.schedules);
            return $('#region2_schedules').timegantt('setSelected', $scope.region2.schedules);
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        return $scope.save = function (e) {
            var $btn;
            $scope.region1.rect = {
                left: Math.round($scope.region1_rect.left / VIDEO_WIDTH * 1000),
                top: Math.round($scope.region1_rect.top / VIDEO_HEIGHT * 1000),
                width: Math.round($scope.region1_rect.width / VIDEO_WIDTH * 1000),
                height: Math.round($scope.region1_rect.height / VIDEO_HEIGHT * 1000)
            };
            $scope.region2.rect = {
                left: Math.round($scope.region2_rect.left / VIDEO_WIDTH * 1000),
                top: Math.round($scope.region2_rect.top / VIDEO_HEIGHT * 1000),
                width: Math.round($scope.region2_rect.width / VIDEO_WIDTH * 1000),
                height: Math.round($scope.region2_rect.height / VIDEO_HEIGHT * 1000)
            };
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/event_cover.json", {
                items: {
                    region1: $scope.region1,
                    region2: $scope.region2
                }
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);

ipcApp.controller('EventProcessController', [
    '$scope', '$http',
    function ($scope, $http) {
        $http.get("" + $scope.$parent.url + "/event_proc.json", {
            params: {
                'items[]': ['input1', 'motion', 'cover'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.input1 = data.items.input1;
            $scope.motion = data.items.motion;
            return $scope.cover = data.items.cover;
        }).error(function (response, status, headers, config) {
            return $scope.$parent.get_error(response, status, headers, config);
        });
        return $scope.save = function (e) {
            var $btn;
            $btn = $(e.target);
            $btn.button('loading');
            return $http.put("" + $scope.$parent.url + "/event_proc.json", {
                items: {
                    input1: $scope.input1,
                    motion: $scope.motion,
                    cover: $scope.cover
                }
            }).success(function () {
                $btn.button('reset');
                return $scope.$parent.success('保存成功');
            }).error(function (response, status, headers, config) {
                $btn.button('reset');
                return $scope.$parent.error(response, status, headers, config);
            });
        };
    }
]);