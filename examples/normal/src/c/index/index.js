import './index.less';
import tpl from './index.ejs';

class Index {
    constructor(...args) {
        this.init(args);
    }
    init(config) {
        //传入渲染的包裹层
        this.el = config.el;
        //渲染
        this.render();
    }
    render() {
        const _html = tpl({
            title: 'Hello World'
        });
        this.el[0].innerHTML = _html;
    }
}

export default Index;
