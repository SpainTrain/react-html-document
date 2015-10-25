import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import cheerio from 'cheerio';
import HTMLDocument from '../src/HTMLDocument';

import TestApp from './TestApp';

function renderAndGetQuerySelector(props, children) {
  const htmlDocumentEl = <HTMLDocument {...props}>{children}</HTMLDocument>;
  const markup = renderToStaticMarkup(htmlDocumentEl);
  return cheerio.load(markup);
}

describe('HTMLDocument', () => {
  it('should render with default props', () => {
    const props = { };
    const qs = renderAndGetQuerySelector(props);
    expect(qs('html').length).to.equal(1);
  });

  it('should render page title', () => {
    const props = {
      title: 'My Title'
    };
    const qs = renderAndGetQuerySelector(props);
    expect(qs('title').html()).to.equal(props.title);
  });

  describe('Metatags', () => {
    it('should render metatags', () => {
      const props = {
        metatags: [
          { name: 'description', content: 'My Description' },
          { name: 'title', content: 'My Title' }
        ]
      };
      const qs = renderAndGetQuerySelector(props);
      const $metatags = qs('meta');
      expect($metatags.length).to.equal(2);
      $metatags.each((index, metatag) => {
        expect(metatag.attribs).to.deep.equal(props.metatags[index]);
      });
    });
  });

  describe('Stylesheets', () => {
    it('should render linked stylesheets from a list of strings', () => {
      const props = {
        stylesheets: ['mysite.com/styles.css']
      };
      const qs = renderAndGetQuerySelector(props);
      const $links = qs('link');
      expect($links.length).to.equal(1);
      expect($links.attr('href')).to.equal(props.stylesheets[0]);
    });

    it('should render linked stylesheet from a list of objects', () => {
      const props = {
        stylesheets: [
          { href: 'mysite.com/styles.css' }
        ]
      };
      const qs = renderAndGetQuerySelector(props);
      const $links = qs('link');
      expect($links.length).to.equal(1);
      expect($links.attr('href')).to.equal(props.stylesheets[0].href);
    });

    it('should render inline styles', () => {
      const props = {
        stylesheets: [
          { inline: '.body { color: #333 }' }
        ]
      };
      const qs = renderAndGetQuerySelector(props);
      const $links = qs('style');
      expect($links.length).to.equal(1);
      expect($links.html()).to.equal(props.stylesheets[0].inline);
    });
  });

  describe('State', () => {
    it('should render state script', () => {
      const props = {
        state: {
          user: {
            name: 'Professor Charles Xavier'
          }
        },
        stateKey: '__state'
      };
      const qs = renderAndGetQuerySelector(props);
      const expectedStateString = `window.${props.stateKey} = {"user":{"name":"Professor Charles Xavier"}};`;
      expect(qs(`script[data-${props.stateKey}]`).html()).to.equal(expectedStateString);
    });

    it('should use state key for state script data attribute', () => {
      const props = {
        stateKey: '__state'
      };
      const qs = renderAndGetQuerySelector(props);
      expect(qs(`script[data-${props.stateKey}]`).length).to.equal(1);
    });

    it('should use state key for state object property', () => {
      const props = {
        state: { },
        stateKey: '__state'
      };
      const qs = renderAndGetQuerySelector(props);
      const stateScript = qs(`script[data-${props.stateKey}]`);
      expect(stateScript.html()).to.match(/window.__state/);
    });
  });

  describe('Scripts', () => {
    it('should render script tags from a list of strings', () => {
      const props = {
        scripts: [
          'mysite.com/main.js'
        ],
        stateKey: '__state'
      };
      const qs = renderAndGetQuerySelector(props);
      const $scripts = qs('script').not(`[data-${props.stateKey}]`);
      expect($scripts.length).to.equal(1);
      expect($scripts.get(0).attribs.src).to.equal(props.scripts[0]);
    });

    it('should render script tags from a list of objects', () => {
      const props = {
        scripts: [
          { src: 'mysite.com/main.js' }
        ],
        stateKey: '__state'
      };
      const qs = renderAndGetQuerySelector(props);
      const $scripts = qs('script').not(`script[data-${props.stateKey}]`);
      expect($scripts.length).to.equal(1);
      expect($scripts.get(0).attribs.src).to.equal(props.scripts[0].src);
    });

    it('should render inline scripts', () => {
      const props = {
        scripts: [
          { inline: 'window.myApp = true;' }
        ],
        stateKey: '__state'
      };
      const qs = renderAndGetQuerySelector(props);
      const $scripts = qs('script').not(`script[data-${props.stateKey}]`);
      expect($scripts.length).to.equal(1);
      expect($scripts.html()).to.equal(props.scripts[0].inline);
    });
  });

  describe('Children', () => {
    it('should use right children container id', () => {
      const childrenContainerId = 'my-app';
      const props = {
        childrenContainerId
      };
      const children = <TestApp />;
      const qs = renderAndGetQuerySelector(props, children);
      expect(qs(`#${childrenContainerId}`).length).to.equal(1);
    });

    it('should render children with own props', () => {
      const props = {
        childrenContainerId: 'app'
      };
      const testAppProps = {
        message: 'Sahp'
      };
      const children = <TestApp {...testAppProps} />;
      const qs = renderAndGetQuerySelector(props, children);
      expect(qs(`#${props.childrenContainerId}`).text()).to.equal(testAppProps.message);
    });

    it('should render children statically', () => {
      const props = {
        shouldRenderChildrenStatically: true
      };
      const children = <TestApp />;
      const qs = renderAndGetQuerySelector(props, children);
      const reactSelector = '[data-reactid]';
      expect(qs(reactSelector).length).to.equal(0);
    });

    it('should render children with react ids for client mounting', () => {
      const props = {
        shouldRenderChildrenStatically: false
      };
      const children = <TestApp />;
      const qs = renderAndGetQuerySelector(props, children);
      const reactSelector = '[data-reactid]';
      expect(qs(reactSelector).length).to.equal(1);
    });
  });
});
