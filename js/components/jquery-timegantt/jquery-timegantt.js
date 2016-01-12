(function ($) {

    var defaults = {
        width: 'auto',
        minWidth: 600,
        weekWidth: 50,
        weekLabels: [
            { id: '', text: '全部' },
            { id: 'sun', text: '日' },
            { id: 'mon', text: '一' },
            { id: 'tue', text: '二' },
            { id: 'wed', text: '三' },
            { id: 'thu', text: '四' },
            { id: 'fri', text: '五' },
            { id: 'sat', text: '六' }
        ],
        maskBackground: 'rgba(135, 206, 250, 0.5)',
        maskBorder: '1px solid #6495ed'
    };

    var Timegantt = function (element, options) {
        this.$el = $(element);
        this.o = $.extend({}, defaults, options);
        this.init();
    }

    Timegantt.prototype = {
        init: function () {
            this._initSize();
            this._createElement();
            this._bindEvent();
        },
        _initSize: function () {
            var _width = this.o.width;
            if (this.o.width == 'auto') {
                _width = this.$el.width();
            }
            _width = _width > this.o.minWidth ? _width : this.o.minWidth;
            var contentWidth = _width - this.o.weekWidth;
            this.tdSize = Math.floor((contentWidth - 1) / 24);
            _width = this.tdSize * 24 + this.o.weekWidth;
            // 如果是IE 6或7
            if (!+'\v1' && !'1'[0]) {
                _width = _width + 24 * 1;
            }
            this.$el.width(_width);
        },
        _createElement: function () {
            var tpl = '';
            for (var i = 0, j = this.o.weekLabels.length; i < j; i++) {
                tpl += '<ul class="' + (i == 0 ? 'timegantt-head ': 'timegantt-row ') + this.o.weekLabels[i].id + ' clearfix">'
                    + this._createWeekElement(this.o.weekLabels[i], i)
                    + this._createContentElement(i)
                    + '</ul>';
            };
            this.$el.html(tpl);
        },
        _createWeekElement: function (weekLabel, rowNum) {
            var weekTpl = '<li class="' + (rowNum == 0 ? 'week-all' : 'week-label')
                + '" style="width:' + this.o.weekWidth + 'px;height:'
                + this.tdSize + 'px;line-height:' + this.tdSize + 'px;">' + weekLabel.text + '</li>';
            return weekTpl;
        },
        _createContentElement: function (rowNum) {
            var contentTpl = '';
            for (var m = 0; m < 24; m++) {
                if (rowNum == 0) {
                    contentTpl += '<li class="hour-label" style="width:' + this.tdSize + 'px;height:'
                        + this.tdSize + 'px;line-height:' + this.tdSize + 'px;">' + m +'</li>';
                } else {
                    contentTpl += '<li class="cell" style="width:' + this.tdSize + 'px;height:' + this.tdSize + 'px;"></li>';
                }
            };
            return contentTpl;
        },
        _bindEvent: function () {
            var me = this;

            // 全部
            me.$el.on('click', '.week-all', function (e) {
                var $this = $(this),
                    len = me.$el.find('.selected').length
                if (len !== 0) {
                    me.$el.find('.selected').removeClass('selected');
                } else {
                    me.$el.find('.cell').addClass('selected');
                }
            });

            // 小时label单元格
            me.$el.on('click', '.hour-label', function (e) {
                var $this = $(this),
                    index = $this.index(),
                    $rows = $this.parent().nextAll(),
                    $cols = $rows.find('li:eq(' + index + ')');
                if ($cols.filter('.selected').length !== 0) {
                    $cols.removeClass('selected');
                } else {
                    $cols.addClass('selected');
                }
            });

            // 星期label单元格
            me.$el.on('click', '.week-label', function (e) {
                var $this = $(this),
                    $cells = $this.nextAll();
                if ($cells.filter('.selected').length !== 0) {
                    $cells.removeClass('selected');
                } else {
                    $cells.addClass('selected');
                }
            });

            // 内容区域单元格
            me.$el.on('mousedown', '.cell', function (e) {
                e.preventDefault();
                me._mousedownHandler(e);
            });
            me.$el.on('mousemove', function (e) {
                e.preventDefault();
                me._mousemoveHandler(e);
            });
            me.$el.on('mouseup', function (e) {
                e.preventDefault();
                me._mouseup(e);
            });
            me.$el.on('mouseleave', function (e) {
                e.preventDefault();
                me._mouseup(e);
            });
        },
        _mousedownHandler: function (e) {
            this.isMousedown = true;
            this.wrapperOffset = this.$el.offset();
            var start = {
                left: e.pageX - this.wrapperOffset.left,
                top: e.pageY - this.wrapperOffset.top
            };
            this.$layerMask = $('<div/>');
            this.$layerMask.data('start', start).data('rect', {
                left: start.left,
                top: start.top,
                width: 0,
                height: 0
            }).css({
                left: start.left,
                top: start.top,
                background: this.o.maskBackground,
                border: this.o.maskBorder,
                position: 'absolute'
            }).appendTo(this.$el);
        },
        _mousemoveHandler: function (e) {
            if (this.isMousedown) {
                var end = {
                    left: e.pageX - this.wrapperOffset.left,
                    top: e.pageY - this.wrapperOffset.top
                };
                var start = this.$layerMask.data('start');
                var cssObj = {
                    left: (start.left < end.left ? start.left : end.left),
                    top: (start.top < end.top ? start.top : end.top),
                    width: Math.abs(start.left - end.left),
                    height: Math.abs(start.top - end.top)
                }
                this.$layerMask.css(cssObj).data('rect', cssObj);
            }
        },
        _mouseup: function (e) {
            if (this.isMousedown) {
                this.isMousedown = false;
                this._selectedCell();
                this.$layerMask.remove();
                this.$el.triggerHandler('changeSelected', this.getSelected());
            }
        },
        _selectedCell: function () {
            var rect = this.$layerMask.data('rect');
            this.$el.find('.cell').each(function (index, item) {
                var $item = $(item),
                    position = $item.position(),
                    size = {
                        width: $item.width(),
                        height: $item.height()
                    };
                if (position.left + size.width >= rect.left &&
                    position.left <= rect.left + rect.width &&
                    position.top + size.height >= rect.top &&
                    position.top <= rect.top + rect.height) {
                    if ($item.hasClass('selected')) {
                        $item.removeClass('selected');
                    } else {
                        $item.addClass('selected');
                    }
                }
            });
        },
        getSelected: function () {
            var $monSelected = this.$el.find('.mon').find('.selected'),
                $tueSelected = this.$el.find('.tue').find('.selected'),
                $wedSelected = this.$el.find('.wed').find('.selected'),
                $thuSelected = this.$el.find('.thu').find('.selected'),
                $friSelected = this.$el.find('.fri').find('.selected'),
                $satSelected = this.$el.find('.sat').find('.selected'),
                $sunSelected = this.$el.find('.sun').find('.selected'),
                monTemp = [],
                tueTemp = [],
                wedTemp = [],
                thuTemp = [],
                friTemp = [],
                satTemp = [],
                sunTemp = [];
            $monSelected.each(function (index, item) {
                monTemp.push($(item).index() - 1);
            });
            $tueSelected.each(function (index, item) {
                tueTemp.push($(item).index() - 1);
            });
            $wedSelected.each(function (index, item) {
                wedTemp.push($(item).index() - 1);
            });
            $thuSelected.each(function (index, item) {
                thuTemp.push($(item).index() - 1);
            });
            $friSelected.each(function (index, item) {
                friTemp.push($(item).index() - 1);
            });
            $satSelected.each(function (index, item) {
                satTemp.push($(item).index() - 1);
            });
            $sunSelected.each(function (index, item) {
                sunTemp.push($(item).index() - 1);
            });

            var data = {
                'mon': monTemp.join(','),
                'tue': tueTemp.join(','),
                'wed': wedTemp.join(','),
                'thu': thuTemp.join(','),
                'fri': friTemp.join(','),
                'sat': satTemp.join(','),
                'sun': sunTemp.join(',')
            };
            return data;
        },
        setSelected: function (data) {
            var me = this;
            for (var key in data) {
                var $row = me.$el.find('.' + key);
                if (data[key]) {
                    var times = data[key].split(',');
                    for (var i = times.length - 1; i >= 0; i--) {
                        $row.find('.cell').eq(times[i]).addClass('selected');
                    };
                }
            };
        }
    };
    var old = $.fn.timegantt;
    $.fn.timegantt = function (option) {
        var args = Array.apply(null, arguments);
        args.shift();
        var internal_return;
        this.each(function () {
            var $this = $(this),
                data = $this.data('timegantt'),
                options = typeof option === 'object' && option;
            var me = this
            if (!data) {
                $this.data('timegantt', (data = new Timegantt(this, options)));
            }
            if (typeof option === 'string' && typeof data[option] === 'function') {
                internal_return = data[option].apply(data, args);
                if (internal_return !== undefined)
                    return false;
            }
        });
        if (internal_return !== undefined)
            return internal_return;
        else
            return this;
    };

    $.fn.timegantt.Constructor = Timegantt;

    /* TIMEGANTT NO CONFLICT
     * =================== */

    $.fn.timegantt.noConflict = function () {
        $.fn.timegantt = old;
        return this;
    };
}(jQuery));