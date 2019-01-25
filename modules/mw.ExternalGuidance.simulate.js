( function () {
	var context = {
		name: 'machine-translation',
		info: {
			service: 'Dummy Translation service',
			from: mw.config.get( 'wgContentLanguage' ),
			to: document.documentElement.lang,
			page: mw.config.get( 'wgTitle' )
		}
	};

	mw.loader.using( [ 'mw.externalguidance' ] ).then( function () {
		var eg = new mw.eg.ExternalGuidance( context.name, context.info );
		eg.init();
	} );
}() );
