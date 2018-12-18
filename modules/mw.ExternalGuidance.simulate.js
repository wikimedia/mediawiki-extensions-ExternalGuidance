( function () {
	var context = {
		name: 'machine-translation',
		info: {
			service: 'Dummy Translation service'
		}
	};

	mw.loader.using( [ 'mw.externalguidance' ] ).then( function () {
		var eg = new mw.ExternalGuidance( context.name, context.info );
		eg.init();
	} );
}() );
