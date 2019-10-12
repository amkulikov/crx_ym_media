(function () {
    function injectScript(src, tag) {
        let node = document.getElementsByTagName(tag)[0];
        let script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', src);
        node.appendChild(script);
    }

    injectScript(chrome.extension.getURL('mediaSession.js'), 'body');
})();