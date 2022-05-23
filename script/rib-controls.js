/**********************************************************************
*   MIT License
*   
*   Copyright (c) 2022 Elber Ribeiro / RibeiroElber
*   
*   Permission is hereby granted, free of charge, to any person obtaining a copy
*   of this software and associated documentation files (the "Software"), to deal
*   in the Software without restriction, including without limitation the rights
*   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*   copies of the Software, and to permit persons to whom the Software is
*   furnished to do so, subject to the following conditions:
*   
*   The above copyright notice and this permission notice shall be included in all
*   copies or substantial portions of the Software.
*
*   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
*   SOFTWARE.
**********************************************************************/

/**********************************************************************/
/**************** DETECT MOBILE DEVICES ******************************/
/**********************************************************************/
var isMobile =
{
    Android   : function () { return navigator.userAgent.match(/Android/i); },
    BlackBerry: function () { return navigator.userAgent.match(/BlackBerry/i); },
    iOS       : function () { return navigator.userAgent.match(/iPhone|iPad|iPod/i); },
    Opera     : function () { return navigator.userAgent.match(/Opera Mini/i); },
    Windows   : function () { return navigator.userAgent.match(/IEMobile/i); },
    any       : function () { return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()); }
};

/*****************************
REMOVE PHONE PATTERNS IN links (MOBILE ONLY)
******************************/
if (isMobile.any() && document.getElementsByName("format-detection").length == 0)
    document.getElementsByTagName('head')[0].innerHTML += ('<meta name="format-detection" content="telephone=no">');

/*****************************
LOADING DEPENDENCIES
******************************/
var RibUIBasepath = './script/';

(function() {
    "use strict";

    var getScript = (function() {
        function getScript(source, callback) {
            var script = document.createElement('script');
            var prior = document.getElementsByTagName('script')[0];
            script.async = 1;
    
            script.onload = script.onreadystatechange = function( _, isAbort ) {
                if(isAbort || !script.readyState || /loaded|complete/.test(script.readyState) ) {
                    script.onload = script.onreadystatechange = null;
                    script = undefined;
                    
                    if(!isAbort && callback) setTimeout(callback, 0);
                }
            };
            
            script.src = source;
            prior.parentNode.insertBefore(script, prior);
        }
        return getScript;
    })();

    new getScript(RibUIBasepath + 'moment.js', function() {
        console.log('loaded => Moment');
        new getScript(RibUIBasepath + 'polyfills.js', function() {
            console.log('loaded => Polyfills and Promises');
            new getScript(RibUIBasepath + 'simple-datatables-classic-min.js', function() {
                console.log('loaded => Simple DataTable');
                new getScript(RibUIBasepath + 'Selectr.min.js', function() {
                    console.log('loaded => Selectr');

                    //dispatch $rib.ready() after load
                    var LoadComplete = function() {
                        $rib.loading(false);
                        document.body.dispatchEvent($rib._ready); 
                    };
                    
                    // Loading hasn't finished yet
                    if (document.readyState === 'loading') {  
                        document.addEventListener('DOMContentLoaded', LoadComplete);
                    } else {  // `DOMContentLoaded` has already fired
                        LoadComplete();
                    }
                }); 
            });
        });
    });

})();


/**************************
 * RIB Components
 **************************/
var RIB = (function() {
    var _this;
    var _notificationBar;
    var _modalList = [];
    var closeLoadingTimeout;
    // Constructor
    function RIB() {
        
        this.name    = 'RIB Components';
        this.version = '2021-1.3';
        this.content = { size : 0 };
        this.resizeContentCallBackFunction = function() {};
        _this = this;
        _notificationBar = new RibNotificationBar();
        this.datePickerList = [];
        this.SelectrList = [];
        
        this._ready = document.createEvent('CustomEvent');
        this._ready.initEvent('RibReady', true, true);
    }

    RIB.prototype.ready = function(callBackFn){
        window.addEventListener('RibReady', callBackFn);
    }
    
    //Cria uma tela indicando que existe algum processo sendo executado!
    //   @status {bool}  - indica se é para exibir(true) ou esconder(false) o controle.
    RIB.prototype.loading = function(status, message, parentObj) {
        var _loading = document.getElementById('rib-loading')

        if(_loading && _loading.children.length > 1 && !(message === true)) //se message
            _loading.childNodes[1].innerHTML = (message || '');
        
        if(_loading && !status)
            closeLoadingTimeout = setTimeout(function() { _loading.remove(); },200);
        else if(_loading && status)
            clearTimeout(closeLoadingTimeout);
        else if(!_loading && status){
            var lo = document.createElement('div');
            lo.id = 'rib-loading';
            lo.innerHTML = '<span class="load-spinner"></span><span class="message">' + (!message || message === true ? '' : message) +'</span>';
            lo.className = (status ? 'fundo show' : 'fundo hide');
            
            if (parentObj)
            parentObj.appendChild(lo);
            else
            document.body.appendChild(lo);
        }
    }
    var resizeContentTimer;

    //AJUSTA A DIV DE RESULTADOS SEMPRE QUE REDIMENSIONAR A JANELA
    RIB.prototype.resizeContent = function(callBackFn){
        clearTimeout(resizeContentTimer);	
        resizeContentTimer = setTimeout(function() {
            var height = 60; //tamanho inicial = Header
            var _s = document.querySelector('.rib-searchPanel');
            var _content = document.getElementById('conteudo')

            if(_s)
                height += _s.getBoundingClientRect().height;

            _content.style.height = 'calc(100% - ' + height + 'px)';

            setTimeout(function() {
                _this.content.size = _content.getBoundingClientRect().height;

                if(callBackFn && !callBackFn.target)
                    _this.resizeContentCallBackFunction = callBackFn;

                _this.resizeContentCallBackFunction();
            }, 0);
        }, 200);
    };

    RIB.prototype.header = function(id, params) { return new RibHeader(id, params, _this) };
    
    RIB.prototype.notificationBar = function(id) { 
        if (id) 
            return  _notificationBar.find(id); 
        else
            return _notificationBar; 
    };

    RIB.prototype.modalDialog = function(id, parameters) {
        var _modal = _modalList.filter(function(f){ return f.id == id}).last();
        if(_modal)
            return _modal;
        else {
            _modal = new RibModalDialog(id, parameters);
            _modalList.push(_modal);
            return _modal;
        }
    }

    RIB.prototype.RibDatePicker = function(selector, parameters) {
        if(selector.tagName)
            var _elements = [selector];
        else
            var _elements = Array.prototype.slice.call(document.querySelectorAll(selector));

        if(_elements && _elements.length > 0){
            var that = this;
            var _novos;
            if (this.datePickerList.length > 0) //verifica se há novos elementos não cri
                _novos = _elements.filter(function(f){ return that.datePickerList.filter(function(d) { return d.element === f || (d.element.id && d.element.id === f.id) }).length == 0;})
            else
                _novos = _elements;

            _novos.forEach(function(el){
                that.datePickerList.push(new RibDatePicker(el, parameters)) //instanciar novos elementos
            })
            var filter = this.datePickerList.filter(function(f){ return _elements.indexOf(f.element) >= 0 || _elements.map(function(e) { return e.id }).indexOf(f.element.id) >= 0;}) //retornar lista de elementos instanciados conforme parametro 'selector' 

            return (filter && filter.length > 0 ? filter : []);
        }
        return [];
    }
    
    RIB.prototype.cpfcnpj = function(el) { return new RibCpfCnpj(el) }

    RIB.prototype.Selectr = function(selector, options) { 
        if(selector.tagName)
            var _elements = [selector];
        else
            var _elements = Array.prototype.slice.call(document.querySelectorAll(selector));

            if(_elements && _elements.length > 0){
                var that = this;
                var _novos;
                if (this.SelectrList.length > 0) //verifica se há novos elementos não cri
                    _novos = _elements.filter(function(f){ return that.SelectrList.filter(function(d) { return d.element.id == f.id }).length == 0;})
                else
                    _novos = _elements;
    
                _novos.forEach(function(el){
                    that.SelectrList.push(new RibSelectr(el, options)) //instanciar novos elementos
                })
                //retornar lista de elementos instanciados conforme parametro 'selector'
                var filter = this.SelectrList.filter(function(f){ return _elements.indexOf(f.element) >= 0;}).map(function(m) { return m.instance }); 
    
                return (filter && filter.length > 0 ? filter : []);
            }
            return [];            
    }

    RIB.prototype.clearElementContent = function(el) { while (el.firstChild) el.removeChild(el.firstChild); }

    return RIB;
}());

var RibHeader = (function() {
    this.defaults = { subtitle: 'Confidential Information', logoURL: null, menuIcon: "fas fa-bars", companyName: 'Rib.UI' };
    
    function RibHeader(id, params, parentObject){
        var _header = document.getElementById(id)

        if (!_header || document.querySelector('.rib-header'))
            return;

        params = Object.assign({}, defaults, params);

        if (params.logoURL)
            var logo = '<span class="icone"><img src="' + params.logoURL +'"/></span><span class="texto">'+ params.companyName + '</span>';
        else
            var logo = '<span class="texto-puro">'+ params.companyName + '</span>';

        var content = '<div id="logo">' + logo + '</div>'
                    + '<div id="titulo">' + params.title
                    + (params.subtitle ? '<div id="rib-subtitle">'+ params.subtitle +'</div>' : '') + '</div>'
                    + '<div id="usuario">'
                    +   '<div class="user-notification"></div>'
                    +   '<div class="info"><span class="name">' + (params.user || '') + '</span><span class="' + params.menuIcon + ' menu-icon"></span>'
                    +   '<div id="rib-menu"><ul></ul></div>'
                    +   '</div></div>';

        _header.innerHTML= content;
        _header.classList.add('rib-header');

        if(parentObject){
            window.onresize = parentObject.resizeContent;
            parentObject.resizeContent();
        }
    }

    //ADD MENU ITENS IN HEADER
    RibHeader.prototype.addMenuOption = function(param) {
        document.querySelector('#rib-menu > ul').innerHTML = '';
        for (var key in param) {
            if (param.hasOwnProperty(key)) {
                document.querySelector('#rib-menu > ul').appendChild(renderSubMenu(key, param[key]));
            }
        }
    };

    //CREATE DOM ELEMENTS FOR MENU ACTIONS IN HEADER
    var renderSubMenu = function(name, item) {

        var ctrl = document.createElement('li');
        if(item.action)
            ctrl.setAttribute('onclick', item.action)

        var opt = ctrl.appendChild(document.createElement('span'));
        var a = ctrl.appendChild(document.createElement('a'));
        a.innerText = name;

        if (item.icon)
            opt.setAttribute('class',item.icon);

        if (item.options) {
            opt.setAttribute('class', 'fas fa-chevron-left');

            var submenu = ctrl.appendChild(document.createElement('div'));
            var ul = submenu.appendChild(document.createElement('ul'));

            submenu.classList.add('submenu');
            Object.keys(item.options).forEach(function(name, i){
                 ul.appendChild(renderSubMenu(name, item.options[name]))
            });
        }
        return ctrl;
    }    

    return RibHeader;

}());

/**********************************************************************/
/*********  EXPAND PANELS (RibExpandPanel())***********************/
/**********************************************************************/
var RibExpandPanel = (function () {
    var _this = null;

    function RibExpandPanel(el, isVisible){
        if(!el.tagName) {
            el = document.querySelector(el);
            if (!el)
                throw TypeError('Cannot convert first argument to object');
        }

        this.element = el;
        _this = this;
        
        if(el.matches('.expand-panel'))
            return this;

        el.classList.add('expand-panel');
        
        if (isVisible === false)
            el.querySelector('.conteudo').classList.add('hide-panel');

        var header = el.querySelector(".header");
        var span = document.createElement('span');
        span.classList.add('fas');
        span.classList.add(isVisible ? 'fa-chevron-down' : 'fa-chevron-right');

        header.insertBefore(span, header.firstChild);
        header.addEventListener('click', function () { toggle(header, _this.options) });
    }
        
    RibExpandPanel.prototype.isVisible = function () { return !_this.element.querySelector('.content').matches('.hide-panel'); };
    RibExpandPanel.prototype.show    = function () { show(_this.element.querySelector('.header')); };
    RibExpandPanel.prototype.hide    = function () { hide(_this.element.querySelector('.header')); };
    RibExpandPanel.prototype.toggle  = function () { toggle(_this.element.querySelector('.header')); };

    var toggle = function(header)
    {
        if (!header.nextElementSibling.matches('.hide-panel'))
            animateObject(header, "rotate_c90", 'fa-chevron-down', 'fa-chevron-right');
        else
            animateObject(header, "rotate_90", 'fa-chevron-right', 'fa-chevron-down');
    }

    var hide = function(header)
    {
        if (!header.nextElementSibling.matches('.hide-panel'))
            animateObject(header, "rotate_c90", 'fa-chevron-down', 'fa-chevron-right');
    }

    var show = function(header)
    {
        if (header.nextElementSibling.matches('.hide-panel'))
            animateObject(header, "rotate_90", 'fa-chevron-right', 'fa-chevron-down');
    }

    var animateObject = function(header, rotate, add, remove)
    {
        var span = header.querySelector('[class^="fas"]');
        span.remove();
        span.classList.add(add);
        span.classList.remove(remove);
        span.style.animation = rotate + ' .2s forwards';

        header.insertBefore(span, header.firstChild);
        header.nextElementSibling.classList.toggle('hide-panel');
    }

    return RibExpandPanel;
})();

/**********************************************************************/
/********   NOTIFICAÇÕES AO USUÁRIO (INSERIDAS NO HEADER) *************/
/**********************************************************************/

var RibNotificationBar = (function(){
    function RibNotificationBar(){
        this.notifications = [];
    }

    RibNotificationBar.prototype.addNotification = function (el, params) { 
        var ico = document.createElement('span');
        params.icon += ' badge';
        params.icon.split(' ').forEach( function(s){
            ico.classList.add(s); //(params.icon, 'badge') não funciona no IE
        });
        ico.setAttribute('data-badge', '0');
        el.appendChild(ico);
        el.innerHTML += '<ul></ul>';
        this.notifications.push(new RibNotification(el, params));
        document.querySelector('.rib-header .user-notification').appendChild(el);
    };

    RibNotificationBar.prototype.find = function(id){
        return this.notifications.filter(function(f) { return f.id === id})[0];
    }
    
    return RibNotificationBar;
}());

var RibNotification = (function(){

    function RibNotification(el, parameters){
        this.element = el;
        this.itens = [];
        this.id = el.id;
        this.params = parameters;
    }

    RibNotification.prototype.add = function (obj, allowDuplicate) { 
        if (allowDuplicate === true || !this.findById(obj.id)) {
            this.itens.push(obj)
            this.element.querySelector('ul').appendChild(RenderNotificationItem(obj))
            refresh(this);
        }
    };

    RibNotification.prototype.clear = function() {
        this.element.querySelector('ul').innerHTML = '';
        refresh(this);
    }

    RibNotification.prototype.remove = function(id) {
        var ls = this.element.parentElement.querySelectorAll("li");
        var item = this.findById(id);
        if(!item)
            throw new RangeError('id not found');
        else
            this.removeAt(item.index);
    }

    RibNotification.prototype.removeAt = function(index) {
        var ls = this.element.parentElement.querySelectorAll("li");
        if (ls.length < index)
            throw new RangeError('index is out of range');
        else {
            ls[index].remove();
            this.itens.splice(index, 1);
        }
        refresh(this);
    }

    RibNotification.prototype.findById = function(id) {
        var el;
        this.itens.forEach(function (e, i){
            if (e.id == id){
                el = e;
                Object.assign(el, {index : i}) //gravar indice no objeto
            }
        });
        return el;
    }

    var refresh = function(_this){
        _this.element.childNodes[0].setAttribute('data-badge', _this.itens.length)
        if(_this.itens.length > 0)
            _this.element.removeAttribute('style')
        else
            _this.element.style.display = 'none';
    }

    //CRIA O HTML DOS ITENS DO MENU DE AÇÕES DO HEADER
    var RenderNotificationItem = function(item) {
        var ctrl = document.createElement('li');

        if(item.action)
            ctrl.addEventListener('click', item.action)

        if (item.html)
            ctrl.innerHTML += item.html;

        if (item.css)
            ctrl.setAttribute('class', item.css);

        //adicionar atributos
        if (item.attr)
            for(var key in item.attr)
                ctrl.setAttribute(key, item.attr[key]);

        return ctrl;
    }
    
    return RibNotification;
}());


var RibSearchPanel = (function(){
    var _this;
    function RibSearchPanel(id, params){
        this.defaults = { onEnter: null, onEscape: null }
        var el = document.getElementById(id);

        if(document.querySelector('.rib-searchPanel'))
            return;

        el.classList.add('rib-searchPanel');

        this.parameters = Object.assign({}, this.defaults, params);
        
        //Adiciona as funções onEscape e onEnter
        if (params.onEnter != null || params.onEscape != null)
        el.addEventListener('keyup', function (ev) { if (ev.keyCode == 13) params.onEnter(); else if (ev.keyCode == 27) params.onEscape(); });
        
        _this = this;
        
        el.innerHTML = '<div class="conteudo">' + el.innerHTML + '</div><div class="rodape"><span class="fas fa-chevron-up"></span></div>'
        el.querySelector('.rodape').addEventListener('click', function(ev, el) {
            this.previousElementSibling.classList.toggle('hide-panel');
            this.childNodes[0].classList.toggle('fa-chevron-down');
            this.childNodes[0].classList.toggle('fa-chevron-up');
            $rib.resizeContent(); //reajusta a tela de conteúdo
        })

    }

    return RibSearchPanel;
}());


/**********************************************************************/
/********   MESSAGEBOX  (new RibMessageBox(mensagem, optional: parameters)) *****************/
/**********************************************************************/
var RibMessageBox = (function(){
    function RibMessageBox(mensagem, params){
        return new RibBaseDialog(Object.assign({ modal: false, message: mensagem }, params))
    }
    return RibMessageBox;
})()

/**********************************************************************/
/********   MODAL DIALOG  (new RibModalDialog(id, parameters)) *****************/
/**********************************************************************/
var RibModalDialog = (function(){
    function RibModalDialog(objId, params){
        //DEFAULT SETTINGS FOR MODAL DIALOG
         params = Object.assign({}, { id: objId, isModal: true, title: '', css: { width: '80%', height: '80%' }, buttons: { Ok: { icon: 'fas fa-check' } }, onEscape: function () { } }, params);
        return new RibBaseDialog(params);
    }
    return RibModalDialog;
})();

/**********************************************************************/
/********   DIALOG BOX  (new RibDialog()) *******************************/
/**********************************************************************/
var RibDialog = (function(){
    function RibDialog(titulo, mensagem, callBack_yes, callBack_no, params){
        this.id = 'rib-DialogBox';
        params = Object.assign({}, params, { modal: false, 'title': titulo, 'message': mensagem });

        if (!params.buttons) {
            params.buttons = {
                "Não": { action: callBack_no, icon: 'fas fa-times', css: { float: 'right' } },
                "Sim": { action: callBack_yes, icon: 'fas fa-check', css: { float: 'left' } }
            }
        }

        params.onEscape = callBack_no;


        if (document.querySelectorAll('#rib-DialogBox').length > 0) // Verifica se já existe uma mensagem na tela
            return;

        //FAZ UM "MERGE" DAS OPÇÕES PADRÕES COM OS PARAMETROS INFORMADOS
        var params = Object.assign({}, this.defaults, params);

        return new RibBaseDialog(params);
    }

    return RibDialog;
})();

var RibBaseDialog = (function() {
    function RibBaseDialog(p) {
        this.defaults = { modal: true, title: 'Atenção', message: '', css: { width: '400px', height: '200px'}, buttons: { Ok: { icon: 'fas fa-check' } }, onEscape : function() {} };
        this.params = Object.assign({}, this.defaults, p);
        
        //GERANDO A CAIXA DE DIÁLOGO 
        this.dialog  = this.params.isModal ? document.getElementById(this.params.id) : document.createElement('div');
        
        
        if(this.dialog.getAttribute('isModal')){
            return this;
        }

        var conteudo = this.params.isModal ? document.getElementById(this.params.id).innerHTML : this.params.message;
        
        this.dialog.setAttribute('isModal', this.params.modal);
        this.dialog.setAttribute('tabIndex', 0);
        
        // if(!this.params.isModal)
        //     this.dialog.id = 'rib-DialogBox';

        this.dialog.classList.add('rib-popup') //('rib-popup', 'hide') não funciona no IE
        this.dialog.classList.add('hide');

        this.dialog.innerHTML = '<div class="fundo"></div>'
                        + '<div class="form"><div class="button-close"><span class="far fa-times-circle"></span></div>'
                        +    '<div class="header">' + this.params.title + '</div>'
                        +    '<div class="conteudo">' + conteudo + '</div></div>'
                        + '</div>';

        if(this.params.css){
            Object.assign(this.dialog.childNodes[1].style, this.params.css); //[1] => .form
        }

        //GERAR O RODAPÉ
        this.dialog.querySelector('.form').appendChild(createModalActionButtons(this));

        var that = this;

        //Adicionar eventos de Fechar o Dialog no fundo e no botão "X"
        this.dialog.querySelectorAll(".fundo, .form div.button-close").forEach(function(e) {
            e.addEventListener("click", function () { that.hide(that.params.onEscape); });
        });
        //Verificar se a tecla ESC foi pressionada para fechar o popup
        this.dialog.addEventListener('keyup', function (e) {
            if (e.keyCode == 27) // escape key maps to keycode `27`
                that.hide(that.params.onEscape);
        }); 

        document.body.appendChild(this.dialog);

        lockTabIndex(this.dialog, true);
        if(!this.params.isModal){
            this.show();
        }
    }

    //CRIA O RODAPÉ DA CAIXA DE DIALOGO COM OS BOTÕES DE AÇÃO
    var createModalActionButtons = function(dialog) {
        var rodape = document.createElement('div');
        rodape.classList.add('rodape');

        //CRIANDO OS BOTÕES DE AÇÃO
        if(dialog.params.buttons){
            for(var btn in dialog.params.buttons){
                var icon =  dialog.params.buttons[btn].icon ? '<span class="' + dialog.params.buttons[btn].icon + '"></span>': '';
        
                var template = document.createElement('div');
        
                template.innerHTML = '<div class="button" tabIndex="0">' + icon + btn + '</div>';
        
                var ctrl = template.childNodes[0];
                
                //aplicar estilo
                if (dialog.params.buttons[btn].css)
                    Object.assign(ctrl.style, dialog.params.buttons[btn].css)

                //caso não exista ação no botão, criar uma padrão que esconde o modal
                // if (!dialog.params.buttons[btn].action)
                //     dialog.params.buttons[btn].action = (!dialog.params.isModal ? function () { } : function () { dialog.hide(); })
        
                //adicionar atributos
                for (var key in dialog.params.buttons[btn].attr)
                    ctrl.setAttribute(key, dialog.params.buttons[btn].attr[key]); //adiciona o atributo (key) e seu valor obj.attr[key]
        
                var exec = (function() {
                    var act = dialog.params.buttons[btn].action || function() { dialog.hide(dialog.params.onEscape) }; //caso não exista ação/ atribuir funcão de "Fechar"
                    if(dialog.params.isModal)
                        return function() { act.apply(this)};
                    else
                        return function() { dialog.hide(act); };
                })();

                //aplicar evento ao botão quando clicar ou pressionar tecla "ENTER" ou "SPACE";
                ctrl.addEventListener('click', exec);
                ctrl.addEventListener('keyup', function (e) { if (e.keyCode == 13 || e.keyCode == 32) exec(); });
        
                rodape.appendChild(ctrl);
            }
        }

        return rodape;
    }
    var openedDialogs = [];

    //ESCONDE A MODAL DIALOG
    RibBaseDialog.prototype.hide = function (callBackFn) {

        var d = this.dialog;
        Object.assign(d.childNodes[1].style, { animation: 'hide-popup .15s forwards',  opacity: 0});
        
        setTimeout(function() { d.classList.add('hide'); },200); //timer para animação de "hide" terminar

        openedDialogs.pop();
        
        lockTabIndex(this.dialog, true);
    
        if(openedDialogs.length > 0)
            lockTabIndex(openedDialogs.last(), false);

        if (callBackFn)
            callBackFn.apply(this);

        if (!this.params.isModal)
            setTimeout(function () { d.remove(); }, 300);
    }

    //EXIBE A MODAL DIALOG
    RibBaseDialog.prototype.show = function (callBackFn) { 
        Object.assign(this.dialog.childNodes[1].style, { animation: 'show-popup .15s ease-in',  opacity: 1});
        this.dialog.classList.remove('hide');
        this.dialog.style.display = '';
    
        lockTabIndex(this.dialog, false);
        openedDialogs.forEach(function(el){ lockTabIndex(el, true) });
        openedDialogs.push(this.dialog)

        if (callBackFn)
            callBackFn();
    }   
    //ATIVA OU DESATIVA A NAVEGAÇÃO POR "TAB" DOS ITENS FORA DO POPUP/MODAL
    function lockTabIndex(el, status)
    {
        var selector = "input, a, .button, [tabIndex]"; //seletor para ativar/desativar controles atrás do MODAL ou POPUP
        if (status)
        {
            el.querySelectorAll(selector).forEach(function(e){ e.setAttribute("tabIndex", "-1");});//desativa todos os tab-index que estão fora do popup
        }
        else
        {
            el.querySelectorAll(selector).forEach(function(el){ el.setAttribute("tabIndex", "0");});
            popupFocus(el); //dar o foco no modal/popup aberto
        }
    }

    //reativa o foco da modal/popup que estava exibindo anteriormente
    function popupFocus(el) { el.querySelectorAll(".rodape .button").last().focus(); }

    return RibBaseDialog;
})();


/**********************************************************************/
/******** Controle de CPF/CNPJ  (RibCpfCnpj())**************************/
/**********************************************************************/
var RibCpfCnpj = (function () {
    
    //Função para formatação e validação de CPF/CNPJ
    function RibCpfCnpj (selector) {
        if(Object.prototype.isPrototypeOf.call(NodeList.prototype, selector))
            this.elements = selector;
        if(selector.tagName)
            this.elements = [selector];
        else
            this.elements = document.querySelectorAll(selector);

        this.elements.forEach(function(element) {
            if (element.getAttribute('RibCpfCnpj'))
                return;

            element.setAttribute('RibCpfCnpj', 1)
            if (element.value)
                element.value = new RibMask().document(element.value);

            element.addEventListener('keypress', function (e) { new RibValidaDigitacao(e, element, { maxLength: 14 }); }); //PERMITE SOMENTE DIGITAÇÃO DE NUMERO(0-9)

            //REMOVE MASCARA AO DAR FOCO NO CONTROLE
            element.addEventListener('focusin', function () { element.value = element.value.replace(/[^0-9]/g, ''); });

            element.addEventListener('focusout',function () {
                var isValid = false;
                var type = getType(element.value);
                var doc = element.value.replace(/[^0-9]/g, '').split('').map(Number);

                if (type === 'cpf') {
                    //VALIDA O PRIMEIRO E O SEGUNDO DIGITO
                    isValid =   verifCPF(soma(doc, [10,  9, 8, 7, 6, 5, 4, 3, 2, 0, 0]), doc[ 9])
                            &&  verifCPF(soma(doc, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 0]), doc[10]);
                }
                else if (type === 'cnpj') {
                    //VALIDA O PRIMEIRO E O SEGUNDO DIGITO
                    isValid =   verifCNPJ(soma(doc, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 0, 0]), doc[12])
                            &&  verifCNPJ(soma(doc, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 0]), doc[13]);
                }
                
                if (isValid && doc.length > 0)
                    element.value = type ==='cpf' ? new RibMask().cpf(doc.join('')) : new RibMask().cnpj(doc.join('')); //FORMATAR 
                else
                    element.value = doc.join('');

                //quando o campo estiver em branco, verificar se é não é requerido para limpar a classe de erro.
                isValid = (doc.length == 0 && !element.attributes.required ? true : isValid);
                changeErrorStatus(element, isValid);
            });
        })
    }

    RibCpfCnpj.prototype.value = function(val) {
        if (val) {
            this.elements.forEach(function (element) {
                val = val.toString();

                if (val.length == 11)
                    element.value = new RibMask().cpf(val);
                else if (val.length > 11 && val.length <= 14)
                    element.value = new RibMask().cnpj(val);
                else
                    throw new SyntaxError('Documento Inválido! - ' + element.id + ' - ' + element.value);
            });
        }
        else
        {
            var values = [];
            this.elements.forEach( function(element) {
                if (element.value.length > 0)
                    values.push(new RibUnmask().cpf(element.value)); //cpf e cnpj usam a mesma fórmula de unMask
            });

            if (values.length == 1)
                return values[0];
            else if (values.length > 1)
                return values;
            else
                return '';
        }
    }

    var soma = function(a, verificador) {
        return a.map(function (digit, i) { return digit * verificador[i]; }).reduce(function (sum, digit) { return sum + digit; }, 0);
    };

    //ADICIONA/REMOVE O ESTILO QUANDO OCORRE ERRO DE VALIDAÇÃO DO CAMPO
    function changeErrorStatus(ctrl, status) {
        if (status){
            ctrl.classList.remove('error');
            ctrl.removeAttribute('title');
        }
        else{
            ctrl.classList.add('error');
            ctrl.setAttribute('title', 'Documento Inválido!');
        }
    }

    function getType(doc) {
        doc = doc.replace(/[^0-9]/g, '').split('').map(Number);
        if (doc.length === 11)
            return 'cpf';
        else if (doc.length > 11 && doc.length <= 14)
            return 'cnpj';
    }

    //VALIDA OS DIGITOS DO CPF
    var verifCPF = function(value, digit) { value = ((value * 10 % 11) === 10 ? 0 : value * 10 % 11); return (value === digit); };

    //VALIDA OS DIGITOS DO CNPJ
    var verifCNPJ = function(value, digit) { value = ((value % 11) < 2 ? 0 : 11 - (value % 11)); return (value === digit); };

    return RibCpfCnpj;

})();

/**********************************************************************/
/******** CONTROLE DE VALORES DECIMAIS  (RibInputDecimal())************/
/**********************************************************************/
var RibInputDecimal = (function() {
    function RibInputDecimal(selector, options) {
        this.options = Object.assign({}, { value: null, precision: 2, maxValue: null, minValue: null }, options);

        if(Object.prototype.isPrototypeOf.call(NodeList.prototype, selector))
            this.elements = selector;
        if(selector.tagName)
            this.elements = [selector];
        else
            this.elements = document.querySelectorAll(selector);

        var that = this;

        this.elements.forEach(function(el){

            if (that.options.precision < 0)
                throw new RangeError("precisão não pode ter valores negativos!");

            //SE NÃO HOUVER O ATTIBUTO, O CONTROLE AINDA NÃO FOI CRIADO!
            else if(!el.getAttribute('precision')){
                Object.assign(el.style, { 'text-align' :  "right"});


                var padrao = that.options.precision == 0 ? '0' : '0,0000000000'.substr(0, that.options.precision + 2);
                el.addEventListener('click',function () { this.select(); });
                el.addEventListener('focusin',function () { this.value = (this.value == padrao ? "" : this.value); this.oldValue = this.value });
                el.addEventListener('focusout',function () {
                        if (this.value)
                            if (isValid(this))
                                this.value = new RibMask().formatType(this.value, that.options.precision);
                            else
                                this.value = this.oldValue;
                        else
                            this.value = padrao;

                    });
                el.addEventListener('keypress', function (e) {
                        new RibValidaDigitacao(e, this, { regex: /[^0-9.,]/g }); //   permitir digitar '.' ou ',' 
                        if (e.keyCode == 46) // 46 = '.'
                            this.value = this.value.replace('.', ',');
                    });
            }
            //Obter valor atual do campo para validar posteriormente
            var actualValue;
            if(el.value)
                actualValue = new RibUnmask().decimal(el.value)
            
            //Definir precisão
            if(that.options.precision != undefined)
                el.setAttribute('precision', that.options.precision);
            
            //Definir maxValue e ajustar valor (caso esteja fora da nova faixa)
            if(that.options.maxValue != undefined){
                el.setAttribute('maxValue', that.options.maxValue);
                if (actualValue > that.options.maxValue)
                    el.value = new RibMask().decimal(that.options.maxValue, that.options.precision);
            }

            //Definir minValue e ajustar valor (caso esteja fora da nova faixa)
            if(that.options.minValue != undefined){
                el.setAttribute('minValue', that.options.minValue);
                if (actualValue < that.options.minValue)
                    el.value = new RibMask().decimal(that.options.minValue, that.options.precision);
            }

            //Definir valor
            if(that.options.value != undefined)
                el.value = new RibMask().decimal(that.options.value, that.options.precision);
        });

        return this;
    }

    RibInputDecimal.prototype.maxValue = function(val) {
        this.elements.forEach(function(e) {
            e.setAttribute('maxValue', val);
        });
        return this;
    }
    RibInputDecimal.prototype.minValue = function(val) { 
        this.elements.forEach(function(e) {
            e.setAttribute('minValue', val);
        });        
        return this;
    }

    RibInputDecimal.prototype.value = function (val) {
        if (val !== undefined)
            this.elements.forEach(function(e) { if(isValid(e, val)) e.value = new RibMask().decimal(val, e.getAttribute('precision')); });
        else
            return new RibUnmask().decimal(this.elements[0].value);
    }

    var isValid = function(obj, value) {
        var precision = obj.getAttribute('precision');
        var maxValue = obj.getAttribute('maxValue');
        var minValue = obj.getAttribute('minValue');

        if(value === undefined)
            value = new RibUnmask().decimal(obj.value, precision);

        var err = "";
        if (!isNaN(value))
        {
            if (maxValue && value > maxValue)
                err = "Valor máximo do campo é de " + new RibMask().decimal(maxValue, precision);
            if (minValue && value < minValue)
                err = "Valor mínimo do campo é de " + new RibMask().decimal(minValue, precision);
        }
        else
            err = "Valor informado não é um numero!";

        if (err.length > 0)
            RibMessageBox(err, { buttons: { Ok: { action: function () { obj.focus(); obj.select(); } } } });

        return (err.length == 0);
    }

    return RibInputDecimal;
})();

var RibInputCep = (function(){
    function RibInputCep(selector){
        if(Object.prototype.isPrototypeOf.call(NodeList.prototype, selector))
            this.elements = selector;
        if(selector.tagName)
            this.elements = [selector];
        else
            this.elements = document.querySelectorAll(selector);

        this.elements.forEach(function(el){
            if(!el.getAttribute('data-cep')){
                el.setAttribute('data-cep', 'true');

                Object.assign(el.style, { 'text-align': 'right'});
    
                el.addEventListener('click', function () { this.value = new RibUnmask().cep(this.value); this.select(); });
                el.addEventListener('focusin', function () { this.value = new RibUnmask().cep(this.value); this.select(); });
                el.addEventListener('focusout', function () {
                    if (this.value) {
                        var value = new RibUnmask().cep(this.value);
                        if (isValid(value, this)){
                            this.classList.remove('error')
                            this.removeAttribute('title');
                            this.value = new RibMask().cep(value);
                        }
                        else{
                            this.classList.add('error');
                            this.setAttribute('title', 'CEP Inválido!');
                        }
                    }
                    else{
                        this.classList.remove('error');
                        this.removeAttribute('title');
                    }
                });
                el.addEventListener('keypress', function (e) {
                    new RibValidaDigitacao(e, this, { maxLength: 8 });
                })
    
                if(el.value)
                    el.value = new RibMask().cep(el.value);
            }
        });

        return this;
    }
    RibInputCep.prototype.validate = function(){
        this.elements.forEach(function (e) {
            return isValid(new RibUnmask().cep(e.value), e)
        });
    }
    RibInputCep.prototype.value = function(val){
        if (val) {
            this.elements.forEach(function(e) { 
                if(isValid(val, e))
                e.value = new RibMask().cep(val);
            });
        }
        else if (this.value != '')
            return new RibUnmask().cep(this.value);
        else
            return '';        
    }

    var isValid  = function (val, obj) {
        var err = '';
        var fn = function () { obj.focus(); };
        if (isNaN(val) || val.length != 8)
            err = "Valor informado não é um CEP válido!";
        if (err.length > 0)
            new RibMessageBox(err, { buttons: { Ok: { action: fn } }, onEscape : fn });

        return (err.length == 0);
    }    

    return RibInputCep;
})();

var RibInputEmail = (function(){
    function RibInputEmail(selector){
        if(Object.prototype.isPrototypeOf.call(NodeList.prototype, selector))
            this.elements = selector;
        if(selector.tagName)
            this.elements = [selector];
        else
            this.elements = document.querySelectorAll(selector);

        this.elements.forEach(function(el){
            if(!el.getAttribute('data-email')) {
                el.setAttribute('data-email', true);
    
                el.addEventListener('focusout', function () { isValid(this.value, this); });
            }
        });
        return this;
    }

    RibInputEmail.prototype.validate = function(showMessage){
        var ls = [];
        this.elements.forEach(function (e) {
            var status = isValid(e.value, e);
            ls.push({ element: e, status: status});
        });
        var valid = ls.filter(function(f) { return f.status === false}).length == 0;

        if (!valid && showMessage)
            new RibMessageBox("email informado não é válido!");

        return valid;
    }

    RibInputEmail.prototype.value = function(val){
        if (val)
            this.elements.forEach(function(e) {  e.value = val; });
        else if (this.value != '')
            return this.value;
        else
            return '';
    }

    var isValid  = function (val, obj) {
        var emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        var isValid = !val || emailRegex.test(val);

        if (isValid){
            obj.classList.remove('error')
            obj.removeAttribute('title');
        }
        else{
            obj.classList.add('error');
            obj.setAttribute('title', 'Email inválido!');
        }

        return isValid;
    }    

    return RibInputEmail;
})();

/**********************************************************************/
/****************** MASCARAS DE FORMATAÇÃO  ***************************/
/**********************************************************************/
var RibMask = (function () {
    function RibMask() {
        return this;
    }

    RibMask.prototype.cnpj = function (value) { 
        if (value.length > 0)
            return value.split('').map(function (digit, i) { return (i === 1 || i === 4 ? digit + '.' : (i === 7 ? digit + '/' : (i === 11 ? digit + '-' : digit))); }).reduce(function (cnpj, digit) { return cnpj + digit });
    }

    RibMask.prototype.cpf = function (value) {
        if(value.length > 0)
            return value.split('').map(function (digit, i) { return ((i == 2 || i == 5) ? digit + '.' : (i == 8 ? digit + '-' : digit)) }).reduce(function (cpf, digit) { return cpf + digit });
    }

    RibMask.prototype.document = function (value) { return getType(value) == 'cpf' ? this.cpf(value) : this.cnpj(value); }

    RibMask.prototype.decimal = function (value, precision) { 
        if (!isNaN(value))
            return formatType(value.toString().replace('.', ','), precision);
        else
            throw new TypeError("Valor informado não é um numero: " + value);
    }

    RibMask.prototype.cep = function (value) {
        if (!isNaN(value))
            return value.split('').map(function (digit, i) { return ((i == 4) ? digit + '-' : digit) }).join('');
        else
            throw new TypeError("Valor informado não é um numero: " + value);
    }
    RibMask.prototype.formatType = function (value, precision) { 
        return formatType(value, precision)
    }

    function getType(doc) {
        doc = doc.replace(/[^0-9]/g, '').split('').map(Number);
        if (doc.length === 11)
            return 'cpf'
        else if (doc.length > 11 && doc.length <= 14)
            return 'cnpj'
    }

    function formatType(value, precision) {
        var total = value.replace(/\./g, '').replace(/^0+/, ''); //remove os '.' depois ',' e depois os '0' à esquerda

        var dec = '0';
        var int = total;

        if (total.indexOf(',') >= 0)
        {
            var sp = total.split(',');
            var dec = (sp[1].length > 0 ? sp[1].substring(0, precision) : dec);  
            var int = total.split(',')[0];
        }

        //formata o valor inteiro com os separadores de milhar ex 18.185.000
        var int = int.split(/(?=(?:\d{3})+(?:\.|$))/g).join(".");

        //adicionar mais precisões ao valor decimal
        dec += '0000000000';

        if (precision > 0)
            return (int.length == 0 ? '0' : int) + ',' + dec.substr(0, precision);
        else
            return (int.length == 0 ? '0' : int);
    }    


    return RibMask;
})();


/**********************************************************************/
/****************** MASCARAS DE FORMATAÇÃO (REMOVER) ******************/
/**********************************************************************/
var RibUnmask = (function () {
    function RibUnmask() {
        return this;
    }

    RibUnmask.prototype.cnpj = function (value) {
        return value.split('').filter(function (digit) { return !isNaN(digit); }).reduce(function (document, digit) { return document + digit; });
    }
    RibUnmask.prototype.cpf = function (value) {
        return value.split('').filter(function (digit) { return !isNaN(digit); }).reduce(function (document, digit) { return document + digit; });
    }
    RibUnmask.prototype.decimal = function (value) {
        return value.length > 0 ? parseFloat(value.replace(/\./g, '').replace(/\,/g, '.')) : 0;
    }
    RibUnmask.prototype.cep = function (value) {
        return value.replace('-', '');
    }

    return RibUnmask;
})();

/******************************************
     FUNÇÃO QUE VALIDA O QUE ESTÁ SENDO DIGITADO EM UM IMPUT USANDO REGEX 
*
*   @_e         - event
*   @_obj       - objeto a ser controlado
*   @params     - &gt;Opcional&lt; - Parametros disponíveis :
*                                       (@maxLength - MaxLength do campo
*                                        @regex     - regex de validação do conteúdo )
*******************************************/
var RibValidaDigitacao = (function() {

    function RibValidaDigitacao(_e, _obj, params)
    {
        this.defaults = { maxLength: 0, regex: /[^0-9]/g };

        if (!_obj.getAttribute('readonly'))
        {
            _e.preventDefault ? _e.preventDefault() : (_e.returnValue = false);

            params = Object.assign({}, this.defaults, params);

            var char = String.fromCharCode(_e.keyCode).replace(params.regex, '');

            if (char.length > 0 && (_obj.selectionStart != _obj.selectionEnd || params.maxLength <= 0 || _obj.value.length < params.maxLength))
            {
                var start = _obj.selectionStart;
                _obj.value = _obj.value.substr(0, start) + char + _obj.value.substr(_obj.selectionEnd);
                _obj.selectionEnd = _obj.selectionStart = start + 1;
            }
        }
        else
            return false;
    };
    
    return RibValidaDigitacao;
})();


var RibPOST = (function(){
    function RibPOST(url, params){
        var p = Object.assign({ method: "POST", url : url }, params);
        return new RibRequest(p);
    }

    RibPOST.prototype.send = function(data){
        this.request.send(data);
    }

    return RibPOST;
})();

var RibGET = (function(){
    function RibGET(url, params){
        var p = Object.assign({ method: "GET", url : url }, params);
        return new RibRequest(p);
    }

    return RibGET;
})();

var RibDownload = (function(){
    function RibDownload(params){
        var defaultParams = Object.assign({ method: "GET", response: 'blob' }, params)

        return new RibRequest(defaultParams)
            .send(defaultParams.data)
            .then(function(ret){
                $rib.loading(true, 'Preparando arquivo para download!');

                var blob = new Blob([ret], { type: defaultParams.mimeType || 'text/pdf' });

                //Create a link element, then 'click' it programatically
                var a = document.createElement("a");

                if(window.navigator.msSaveOrOpenBlob)// IE11 compatibility
                    window.navigator.msSaveOrOpenBlob(blob, defaultParams.fileName);
                else{
                    var blobUrl = window.URL.createObjectURL(blob); //Create a DOMString representing the blob and point the link element towards it
        
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.href = blobUrl;
                    a.download = defaultParams.fileName;
                    a.click();
                    
                    window.URL.revokeObjectURL(blobUrl); //release the reference to the file by revoking the Object URL
                }
                //wait some ms to remove download button
                setTimeout(function () { 
                    if(a){
                        a.remove();
                    }
                    $rib.loading(false);
                }, 500);
            });
    }

    return RibDownload;
})();

var RibRequest = (function(){
    function RibRequest(params){
        if (params){
            this.method      = params.method;
            this.url         = params.url;
            this.data        = params.data;
            this.message     = params.message;
            this.async       = params.async !== false;
            this.showLoading = params.loading !== false;
            this.contentType = params.contentType || 'application/json; charset=utf-8';
            this.response    = params.response || 'json';
            this.xhrOnLoad   = params.onLoad;
        }
        this.xhr         = new XMLHttpRequest();
        return this;
    }

    RibRequest.prototype.send = function(data){
        this.data        = data;
        if(this.method == 'GET' && this.data)
            this.url += getParameters(this.data)

        if(this.showLoading){
            $rib.loading(true, this.message);
            this.xhr.onreadystatechange = function(r){ if (r.currentTarget.readyState == 4) $rib.loading(false); }
        }
        
        this.xhr.open(this.method, this.url, this.async);
        this.xhr.setRequestHeader('Content-Type', this.contentType)
        this.xhr.send(this.data? JSON.stringify(this.data) : null);

        
        var that = this;
        return new Promise(function(resolve, reject) {
            if(that.async){
                var useListener = true;
                if(!that.xhrOnLoad){
                    useListener = false;
                    that.xhrOnLoad = function() { 
                        if(that.xhr.status == 200)
                            resolve(toJSON(that.xhr.response));
                        else
                            reject(toJSON(that.xhr.response, that.xhr.statusText));
                    };
                }

                that.xhr.responseType = that.response;
                that.xhr.addEventListener("load", that.xhrOnLoad );
                that.xhr.addEventListener("error", function() { reject(toJSON(that.xhr.response, that.xhr.statusText)); });
            }
            else{
                if(this.xhr.status === 200)
                    resolve(toJSON(that.xhr.response))
                else
                    reject(toJSON(that.xhr.response, that.xhr.statusText))
            }
        });
        
    }
    // IE 11 compatibility for response.json
    var toJSON = function(obj, statusText){
        if(!obj && statusText) //status Text only on error (obj == null)
            return { Message : statusText }
        else if (Object.prototype.toString.call(obj) === '[object String]')
            return tryParseJSON(obj) || { Message : statusText };
        else    
            return obj;
    }

    var tryParseJSON = function(str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    }    

    function getParameters(data){
        return '?' + Object.keys(data).map(function(key) { return key + "=" + data[key]; }).join('&');
    }

    return RibRequest;
})();

var RibDatePicker = (function(){
    'use strict'
    var changeFlag = false;
    function RibDatePicker(el, params){
        this.settings = {
            monthNames: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
            monthNamesShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
            dayNames: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
            dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
            dayNamesMin: ["D", "S", "T", "Q", "Q", "S", "S"],
            regexInput: /[^0-9\/\.\-]/, 
            regexValidation: /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{4})/,
            dateFormat: 'dd/mm/yyyy',
            onChange : function() {}
        }
        Object.assign(this.settings, params);

        if(this.settings.value)
            this.selectedDate = this.settings.value;

        this.element = el.tagName ? el : document.querySelector(el);

        var that = this;

        if (that.element.parentNode && that.element.parentNode.getAttribute('datepicker'))
            return that;

        Object.assign(that.element.style, { 'text-align': 'right'});
        
        var wrapper = document.createElement('span'); // create wrapper container
        wrapper.classList.add('dt-picker-wrapper')
        wrapper.setAttribute('datepicker', 'dPk' + that.element.id);
        that.element.parentNode.insertBefore(wrapper, that.element); // insert wrapper before el
        wrapper.appendChild(that.element); // move el into wrapper

        var icon = document.createElement('span');
        icon.setAttribute('class', 'far fa-calendar-alt icon')
        wrapper.appendChild(icon)
        
        var calendar = document.createElement('div');
        calendar.id = 'dPk' + that.element.id;
        calendar.classList.add('dt-picker-wrapper-calendar');
        calendar.classList.add('hidden');
        document.body.appendChild(calendar);
        RenderCalendar(calendar, this.selectedDate, that);
        
        icon.addEventListener('click', function() { 
            var input = this.previousElementSibling; 
            if (document.activeElement != input) 
                input.focus();
            else
                input.bur() 
        });
        
        that.element.addEventListener('focusin' , toggleCalendar.bind(this, true, that));
        that.element.addEventListener('focusout', function() { setTimeout( that.focusOut.bind(this, el, that), 100); });
        that.element.addEventListener('keypress', function (e) {
            new RibValidaDigitacao(e, this, { maxLength: 10, regex: that.settings.regexInput });
            if(this.value && that.settings.regexValidation.test(this.value))
                that.setDate();
        });
    }

    RibDatePicker.prototype.destroy = function() {
        if($rib && $rib.datePickerList && $rib.datePickerList.length > 0){
            var index = $rib.datePickerList.indexOf(this);
            if(index >=0)
                $rib.datePickerList.splice(index, 1);
        }

        var idPicker = this.element.parentNode.getAttribute('datepicker')
        //this.element.parentNode.removeAttribute('datepicker')
        this.element.parentNode.parentNode.insertBefore(this.element, this.element.parentNode);
        this.element.nextElementSibling.remove();
        document.getElementById(idPicker).remove();
    }

    RibDatePicker.prototype.setDate = function(date, triggerChange) {
        if(triggerChange == null || triggerChange === true)
            changeFlag = true;

        if(date){
            this.selectedDate = date;
            this.element.value = date.toLocaleDateString().replace(/\u200E/g, '');
        }
        else if(this.element.value.length > 0){
            var dt = this.element.value.split(/(?:\/|\-|\.)/); //split de / ou . ou -
            this.selectedDate = new Date(dt[2], dt[1]-1, dt[0]);
        }

        //RenderCalendar(document.getElementById('dPk' + this.element.id), this.selectedDate, this);
    }    

    RibDatePicker.prototype.focusOut = function(ctrl, objRef){
        if(!(objRef.remainVisible === true)){ //se for null
            toggleCalendar(false, objRef); 
            if(ctrl.value.length > 0){
                var dt = ctrl.value;
                var isValid = objRef.settings.regexValidation.test(dt);
                changeErrorStatus(ctrl, isValid);
                if(isValid && changeFlag){
                    objRef.settings.onChange(objRef);
                    changeFlag = false;
                }
            }

        }
        objRef.remainVisible = false; //flag to control state when clicking inside DatePicker
    }

    var changeMonth = function(element, dateRef, counter, objRef){
        objRef.remainVisible = true;
        var D = new Date(dateRef.setMonth( dateRef.getMonth() + counter))
        RenderCalendar(element, D, objRef);
        setTimeout(function() {
            document.getElementById(element.id.replace('dPk', '')).focus();
        }, 0);
    }       

    var toggleCalendar = function(visible, obj) {
        
        var el = obj.element.parentNode;

        var picker = document.getElementById(el.getAttribute('datepicker'));
        var isHidden = picker.classList.contains('hidden');
        
        if      (visible ===  true &&  isHidden) picker.classList.remove('hidden');
        else if (visible === false && !isHidden) picker.classList.add('hidden');
        else if ((visible == null || visible.target)  &&  isHidden) obj.element.focus();

        if(picker.classList.contains('hidden'))
            picker.removeAttribute('style'); //picker.style =  null; //not compatible on IE (strict mode)
        else {
            var viewportOffset = el.getBoundingClientRect();
            Object.assign(picker.style, { top: viewportOffset.top + 'px', left: viewportOffset.left + 'px'});
        }
    }    

    //ADICIONA/REMOVE O ESTILO QUANDO OCORRE ERRO DE VALIDAÇÃO DO CAMPO
    var changeErrorStatus = function(ctrl, status) {
        if (status){
            ctrl.classList.remove('error');
            ctrl.removeAttribute('title');
        }
        else{
            ctrl.classList.add('error');
            ctrl.setAttribute('title', 'Data Inválida!');
        }
    }  

    var RenderCalendar = function(element, dateRef, objRef){
        var today = dateRef || new Date();

        var head = document.createElement('div');
        head.classList.add('header');
        
        head.innerHTML = '<span class="fas fa-angle-double-left"></span><span class="fas fa-angle-left"></span>'
                        + '<span class="name">' + objRef.settings.monthNames[today.getMonth()] + '<br />' + today.getFullYear() + '</span>'
                        + '<span class="fas fa-angle-right"></span><span class="fas fa-angle-double-right"></span>';
        head.childNodes[0].addEventListener('mousedown', changeMonth.bind(this, element, today, -12, objRef)); //usar mouseDown pois 'click' não é disparado (elemento é escondido antes) da ação!
        head.childNodes[1].addEventListener('mousedown', changeMonth.bind(this, element, today,  -1, objRef));
        head.childNodes[3].addEventListener('mousedown', changeMonth.bind(this, element, today,   1, objRef));
        head.childNodes[4].addEventListener('mousedown', changeMonth.bind(this, element, today,  12, objRef));

        //TODO: create months/Years blocks inside datepicker
        // var months = document.createElement('div');
        // months.classList.add('months');
        // months.classList.add('hidden');
        // objRef.settings.monthNamesShort.forEach(function(f){ months.innerHTML +='<span>' + f + '</span>' });

        // var years = document.createElement('div');
        // years.classList.add('years');
        // years.classList.add('hidden'); //classList.add('years', 'hidden') não funciona no IE
        
        // for(var i = today.getFullYear()-4;i<= today.getFullYear()+4;i++)
        //     years.innerHTML +='<span>' + i + '</span>';

        element.innerHTML = '';
        element.appendChild(head);
        
        // element.appendChild(years);
        // element.appendChild(months);
        
        var days = element.appendChild(document.createElement('div'));
            days.classList.add('days');

        var week = days.appendChild(document.createElement('div'));
            week.classList.add('week-days');
            week.innerHTML = '<span>' + objRef.settings.dayNamesShort.join('</span><span>') + '</span>';

        var maxDays = 40 - new Date(today.getFullYear(), today.getMonth(), 40).getDate();
        var minDate = new Date(today.getFullYear(), today.getMonth(), 1 -new Date(today.getFullYear(), today.getMonth(), 1).getDay());
        var maxDate = new Date(today.getFullYear(), today.getMonth(), maxDays);
            maxDate = maxDate.setDate(maxDays + (6 - maxDate.getDay())); //acrescentar até 7 dias no calendário para preencher as datas sobresalentes

        renderDays(days, minDate, maxDate, today, objRef);
    }

    var click = function(el, date, objRef) { 
        var sel = el.parentNode.querySelector('.selected');

        if(sel)
            sel.classList.remove('selected');

        el.classList.add('selected');
        objRef.remainVisible = false; //controle de estado quando ocorrem ações de click dentro do DatePicker
        objRef.setDate(date);
    }

    var renderDays = function(daysElement, minDate, maxDate, datRef, objRef) {
        for (var d = minDate; d <= maxDate; d.setDate(d.getDate() + 1)){
            var day = daysElement.appendChild(document.createElement('span'));

            if(d.getMonth() != datRef.getMonth())
                day.classList.add('other-month');

            if(d.toLocaleDateString() == new Date().toLocaleDateString())
                day.classList.add('today');
            
            if(objRef.selectedDate && objRef.selectedDate.toLocaleDateString() == d.toLocaleDateString())
                day.classList.add('selected');

            day.setAttribute('title', d.toLocaleDateString().replace(/\u200E/g, '')); //localeDateString() bugFix ANSI chars
            day.addEventListener('mousedown', click.bind(this, day, new Date(d), objRef));
            day.innerHTML = d.getDate();
        }
        return daysElement;
    }
    return RibDatePicker;
})();

var RibTable = (function () {
    function RibTable(obj, columns, data, options) {
        this.id = obj.tagName ? obj.id : document.querySelector(obj).id;
        this.data = data;

        if(!options)
            options = {};

        if(!columns)
            Object.assign(options, { data: toDataTableSrc(data, columns)})
        else
            Object.assign(options, { columns: columns, data: toDataTableSrc(this.data, columns)})

        this.instance = new DataTable(obj, options);
        this.instance.parentObject = this;
    }

    RibTable.prototype.refresh = function(opt, sortColumn, sortDirection) {
        $rib.loading(true, true);
        this.instance.refresh();
        this.instance.destroy();
        if(!opt)
            opt = {};
        Object.assign(this.instance.options, opt, { data: toDataTableSrc(this.data, this.instance.options.columns)})

        var that = this;
        this.instance.on('datatable.init', function() {
            if(sortColumn)
                that.instance.columns().sort(sortColumn, sortDirection);
            $rib.loading(false);
        });

        this.instance.init(this.instance.options);
    }

    // Converting tables to arrays for DataTables component
    function toDataTableSrc(srcData, columns) {
        var obj = {
            headings: columns ? columns.map(function (e) { return e.title }) : Object.keys(srcData[0]),
            data: []
        }

        // Converting table values in data array
        for (var i = 0; i < srcData.length; i++) {
            obj.data[i] = [];

            Object.keys(srcData[i])

            if (!columns) {
                for (var p in srcData[i]) {
                    if (srcData[i].hasOwnProperty(p)) {
                        obj.data[i].push(srcData[i][p]);
                    }
                }
            }
            else {
                columns.map(function (m) { return m.data }).forEach(function (e) {
                    if (srcData[i].hasOwnProperty(e)) {
                        obj.data[i].push(srcData[i][e]);
                    }
                })
            }
        }
        return obj;
    }

    return RibTable;
})();

var RibSelectr = (function () {
    function RibSelectr(obj, options) {
        this.id = obj.tagName ? obj.id : document.querySelector(obj).id;
        
        if(obj.tagName)
            this.element = obj;
        else
            this.element = document.querySelector(obj);

        this.instance = new Selectr(obj, options);
    }
    return RibSelectr;
})();

var $rib = new RIB('');
