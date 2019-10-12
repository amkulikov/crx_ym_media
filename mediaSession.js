(() => {
    let safeCall = (fn) => {
        try {
            fn();
        } catch (e) {
            let fname = fn.name;
            if (fname === "") {
                fname = "anonymous function";
            }
            console.error(fname + " failed:", e);
        }
    };

    let safeCallFn = (fn) => {
        return () => safeCall(fn);
    };

    let mediaSessionRegister = () => {
        let mediaSession = navigator['mediaSession'];
        let yaApi = window['externalAPI'];

        // check mediaSession support
        if (!mediaSession) {
            console.warn("Media session is not supported!");
            return;
        }

        // check ya music externalAPI availability
        if (!yaApi) {
            console.warn("Yandex music externalAPI is not found!");
            return;
        }

        // register handler for rebuilding metadata when track changes
        yaApi.on(
            yaApi.EVENT_TRACK,
            safeCallFn(() => {
                mediaSession.metadata = buildMediaMetadataForCurrentTrack(yaApi);
            })
        );
        // init metadata with current track
        mediaSession.metadata = buildMediaMetadataForCurrentTrack(yaApi);

        // register handlers for media actions
        mediaSession.setActionHandler('play', safeCallFn(() => yaApi.togglePause(false)));
        mediaSession.setActionHandler('pause', safeCallFn(() => yaApi.togglePause(true)));
        mediaSession.setActionHandler('previoustrack', safeCallFn(yaApi.prev));
        mediaSession.setActionHandler('nexttrack', safeCallFn(yaApi.next));

        console.debug("Media session registered!");
    };


    // https://developer.mozilla.org/en-US/docs/Web/API/MediaMetadata
    let buildMediaMetadataForCurrentTrack = (yaApi) => {
        const artistNamesSeparator = ' / ';

        let currentTrack = yaApi.getCurrentTrack();
        if (!currentTrack) {
            return null;
        }
        let artistNames = currentTrack.artists.map((artist) => {
            return artist.title;
        });

        let artwork = [];
        // build cover images
        // https://developer.mozilla.org/en-US/docs/Web/API/MediaMetadata/artwork
        if (currentTrack.cover) {
            // allowed sizes from api docs
            let allowedCoverSizes = ["30x30", "50x50", "80x80", "100x100", "200x200", "300x300", "400x400"];
            let src = currentTrack.cover;
            if (!/^(https?:)?\/\//i.test(src)) {
                src = 'https://' + src;
            }
            allowedCoverSizes.forEach((sz) => {
                artwork.push({src: src.replace("%%", sz), sizes: sz});
            })
        }

        let albumName;
        if (currentTrack.album && currentTrack.album.name) {
            albumName = currentTrack.album.title
        }

        return new MediaMetadata({
            title: currentTrack.title,
            artist: artistNames.join(artistNamesSeparator),
            album: albumName,
            artwork: artwork
        });
    };

    safeCall(mediaSessionRegister);
})();
