ipcApp.controller('HomeController', [
    '$scope', '$timeout', '$http',
    function ($scope, $timeout, $http) {
        var direction_status, getVideo, resizeVideo, resolution_mapping, restore_interval;

        // 设置默认cookie传输
        $http.defaults.headers.common['Set-Cookie'] = 'token=' + getCookie('token');
        $scope.speed = 50;
        $scope.aperture_val = 0;
        $scope.distance_val = 0;
        $scope.zoom_val = 0;
        $scope.light = false;
        $scope.wiper = false;
        $scope.current_stream = 'main_profile';
        $scope.microphone = 50;
        $scope.off_microphone = false;
        $scope.volume = 40;
        $scope.mute = false;
        $scope.play_status = 'play';
        $scope.ptz_position = 'left';
        $scope.ptz_status = 'show';
        $scope.role = getCookie('userrole');
        $scope.current_size = {};
        restore_interval = null;
        $http.get("" + window.apiUrl + "/day_night_mode.json", {
            params: {
                'items[]': ['force_night_mode'],
                v: new Date().getTime()
            }
        }).success(function (data) {
            $scope.light = data.items.force_night_mode;
        }).error(function (response, status, headers, config) {
            if (status === 401) {
                location.href = '/login';
            }
        });
        $scope.$watch('light', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $http.put("" + window.apiUrl + "/day_night_mode.json", {
                    items: {
                        force_night_mode: $scope.light
                    }
                });
            }
        });

        // 复位光圈、焦距、变焦
        $('#home_content').on('slide', '.special', function () {
            clearInterval(restore_interval);
            restore_interval = setInterval(function () {
                if ($scope.aperture_val > 0) {
                    return console.log('++++++');
                } else {
                    return console.log('------');
                }
            }, 500);
        });
        $('#home_content').on('change', '.special', function () {
            $scope.aperture_val = 0;
            $(this).val(0);
            return clearInterval(restore_interval);
        });
        direction_status = false;
        $scope.start_direction = function (direction) {
            direction_status = true;
            return console.log(direction);
        };
        $scope.stop_direction = function () {
            direction_status = false;
            return console.log('stop direction');
        };

        // 鼠标移开后释放需清楚interval
        $(document).on('mouseup', function () {
            if (direction_status === true) {
                return $scope.stop_direction();
            }
        });
        $scope.toggle_device_control = function () {
            var screen_params, sidebar_params;
            if ($scope.ptz_status === 'show') {
                $scope.ptz_status = 'hide';
                if ($scope.ptz_position === 'left') {
                    sidebar_params = {
                        left: -300
                    };
                    screen_params = {
                        left: 0
                    };
                } else {
                    sidebar_params = {
                        right: -300
                    };
                    screen_params = {
                        right: 0
                    };
                }
            } else {
                $scope.ptz_status = 'show';
                if ($scope.ptz_position === 'left') {
                    sidebar_params = {
                        left: 0
                    };
                    screen_params = {
                        left: 300
                    };
                } else {
                    sidebar_params = {
                        right: 0
                    };
                    screen_params = {
                        right: 300
                    };
                }
            }
            $('#home_sidebar').animate(sidebar_params, 500);
            $('#screen_wrap').animate(screen_params, 500);
            $('#collapse_block').animate(screen_params, 500);
        };
        $scope.change_stream = function (stream) {
            $scope.current_stream = stream;
            getVideo();
        };
        $scope.toggle_microphone = function () {
            $scope.off_microphone = !$scope.off_microphone;
        };
        $scope.toggle_volume = function () {
            $scope.mute = !$scope.mute;
        };
        $scope.play_or_pause = function () {
            if ($scope.play_status === 'play') {
                $scope.play_status = 'stop';
                stopVlc();
            } else {
                $scope.play_status = 'play';
                playVlc();
            }
        };
        $scope.change_ptz_position = function () {
            $('#collapse_block, #home_sidebar, #screen_wrap').removeAttr('style');
            $scope.ptz_status = 'show';
            if ($scope.ptz_position === 'left') {
                $scope.ptz_position = 'right';
            } else {
                $scope.ptz_position = 'left';
            }
        };
        resolution_mapping = {
            '1080P': {
                width: 1920,
                height: 1080
            },
            'UXGA': {
                width: 1600,
                height: 1200
            },
            '960H': {
                width: 1280,
                height: 960
            },
            '720P': {
                width: 1280,
                height: 720
            },
            'D1': {
                width: 720,
                height: 576
            },
            'CIF': {
                width: 352,
                height: 288
            }
        };
        getVideo = function () {
            $http.get("" + window.apiUrl + "/video.json", {
                params: {
                    'items[]': [$scope.current_stream],
                    v: new Date().getTime()
                }
            }).success(function (data) {
                $scope.current_size = resolution_mapping[data.items[$scope.current_stream].resolution];
                resizeVideo();
                playVlc($scope.current_stream);
            }).error(function (response, status, headers, config) {
                if (status === 401) {
                    location.href = '/login';
                }
            });
        };
        getVideo();
        resizeVideo = function () {
            var $screen_wrap, actual_size, height_ratio, margin_top, ratio, width_ratio, _height, _width;
            $screen_wrap = $('#screen_wrap');
            actual_size = {
                width: $screen_wrap.width(),
                height: $screen_wrap.height()
            };
            _width = $scope.current_size.width;
            _height = $scope.current_size.height;
            if ($scope.current_size.width > actual_size.width && $scope.current_size.height > actual_size.height) {
                width_ratio = actual_size.width / $scope.current_size.width;
                height_ratio = actual_size.height / $scope.current_size.height;
                ratio = width_ratio;
                if (width_ratio > height_ratio) {
                    ratio = height_ratio;
                }
                _width = $scope.current_size.width * ratio;
                _height = $scope.current_size.height * ratio;
            }
            $('#vlc').width(_width).height(_height);
            if (_height < actual_size.height) {
                margin_top = (actual_size.height - _height) / 2;
                $('#vlc').css('margin-top', margin_top + 'px');
            } else {
                $('#vlc').css('margin-top', '0px');
            }
        };
        $(window).on('resize', function (e) {
            resizeVideo();
        });
    }
]);