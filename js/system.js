ipcApp.controller('SystemInfoController', [
    '$scope', '$http', '$timeout',
    function ($scope, $http, $timeout) {
        var DrawChart, cpu_chart, get_system_info, get_timeout, info_timeout, memory_chart, net_chart;
        $scope.cpu_usage = 0;
        $scope.memory_usage = 0;
        $scope.net_speed = 0;
        info_timeout = null;
        DrawChart = (function () {
            function DrawChart($el, scale_line_color, scale_grid_line_color, fill_color, stroke_color) {
                this.$el = $el;
                this.data = [];
                this.labels = [];
                this.ctx = $el[0].getContext('2d');
                this.chart_options = {
                    pointDot: false,
                    scaleLineColor: scale_line_color,
                    scaleGridLineColor: scale_grid_line_color,
                    showTooltips: false,
                    scaleOverride: true,
                    scaleSteps: 10,
                    scaleStepWidth: 10,
                    scaleStartValue: 0,
                    animation: false
                };
                this.fill_color = fill_color;
                this.stroke_color = stroke_color;
                this.init();
                this.draw();
            }

            DrawChart.prototype.init = function () {
                var $parent, i, _i;
                $parent = this.$el.parent();
                this.$el[0].width = $parent.width();
                this.$el[0].height = $parent.height();
                for (i = _i = 60; _i > -1; i = _i += -5) {
                    this.labels.push(i + 's');
                    this.data.push(0);
                }
            };

            DrawChart.prototype.getLineChartData = function () {
                var lineChartData = {
                    labels: this.labels,
                    datasets: [{
                        label: 'Chart',
                        fillColor: this.fill_color || 'rgba(220,220,220,0.2)',
                        strokeColor: this.stroke_color || 'rgba(220,220,220,1)',
                        data: this.data
                    }]
                };
                return lineChartData;
            };

            DrawChart.prototype.draw = function () {
                new Chart(this.ctx).Line(this.getLineChartData(), this.chart_options);
            };

            DrawChart.prototype.redraw = function (value) {
                this.data.push(value);
                this.data.shift();
                this.draw();
            };

            return DrawChart;

        })();
        cpu_chart = new DrawChart($('#cpu_cvs'), '#b9d8ee', '#b9d8ee', 'rgba(184, 218, 249, 0.5)', '#3495f0');
        memory_chart = new DrawChart($('#memory_cvs'), '#c4e5b9', '#c4e5b9', 'rgba(205, 233, 196, 0.5)', '#80c269');
        net_chart = new DrawChart($('#net_cvs'), '#4433ab', '#4433ab', 'rgba(184, 177, 227, 0.5)', '#bbb5e4');
        get_timeout = function () {
            $timeout.cancel(info_timeout);
            info_timeout = $timeout(function () {
                get_system_info();
            }, 5000);
        };
        get_system_info = function () {
            $http.get("" + window.apiUrl + "/sysinfo.json", {
                params: {
                    v: new Date().getTime()
                }
            }).success(function (data) {
                $scope.cpu = data.sysinfo.cpu;
                $scope.memory = data.sysinfo.memory;
                $scope.net = data.sysinfo.net;
                $scope.uptime = data.sysinfo.uptime;
                $scope.cpu_usage = data.sysinfo.cpu.usage;
                $scope.memory_usage = data.sysinfo.memory.usage;
                $scope.net_speed = data.sysinfo.net.tx_speed;
                cpu_chart.redraw(data.sysinfo.cpu.usage);
                memory_chart.redraw(data.sysinfo.memory.usage);
                net_chart.redraw(data.sysinfo.net.tx_speed);
                get_timeout();
            }).error(function (response, status, headers, config) {
                if (status === 401) {
                    delCookie('username');
                    delCookie('userrole');
                    delCookie('token');
                    setTimeout(function () {
                        location.href = '/login';
                    }, 200);
                } else if (status === 403) {
                    location.href = '/login';
                }
            });
        };
        get_system_info();
    }
]);