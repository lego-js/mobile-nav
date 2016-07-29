import * as toggle from 'lego-toggle';
import data from 'lego-data';

const filter = (arr, fnc) => Array.prototype.filter.call(arr, fnc);

export let DEFAULTS = {
    rootSelector: false,
    subNavClass: 'MobileNav-sub'
};

class Section {

    constructor(node, group, opts) {
        this.header = node.querySelector('header');
        this.navHeader = this.header.cloneNode(true);
        const nav = node.querySelector(`.${opts.subNavClass}`);
        nav.insertBefore(this.navHeader, nav.firstChild);

        const panel = new toggle.Panel(node, { group, nav });
        new toggle.Trigger(this.header, { panel });
        new toggle.Trigger(this.navHeader, { panel });

        // recursively initialize nested sections
        const subSections = filter(nav.children, node => node.tagName.toLowerCase() === 'section');

        if (subSections.length) {
            const subGroup = panel.opts.subGroup = new toggle.Group({
                state: 'open',
                parentNode: node,
            });

            subSections.forEach(node => new Section(node, subGroup, opts));
        }
    }
}

export default class MobileNav {

    constructor(node, options = {}) {
        this.node = node;

        this.opts = Object.create(DEFAULTS);
        this.setOptions(options);

        // initialize active section as top level container
        const parentNode = this.opts.rootSelector ? this.node.querySelector(this.opts.rootSelector) : this.node;

        const group = new toggle.Group({
            state: 'open',
            parentNode,
        });

        filter(parentNode.children, sectionNode => sectionNode.tagName.toLowerCase() === 'section')
            .forEach(sectionNode =>
                new Section(sectionNode, group, this.opts)
            );
    }

    setOptions(options) {
        Object.keys(options).forEach(key => {
            this.opts[key] = options[key];
        });
    }

    close(group) {
        if (group.activePanel) {
            if (group.activePanel.opts.subGroup) {
                this.close(group.activePanel.opts.subGroup);
            }
            group.removeActivatePanel();
        }
    }
}

MobileNav.getInstance = function getMobileNavInstance(node, options) {
    let menu = data(node, '_mobileNav');
    if (!(menu instanceof MobileNav)) {
        data(node, '_mobileNav', menu = new MobileNav(node, options));
    } else {
        menu.setOptions(options);
    }
    return menu;
};
