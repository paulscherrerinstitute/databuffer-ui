interface DataUiStartupConfig {
	TITLE: string
	QUERY_API: string
	DISPATCHER_API: string
	CONTACT_EMAIL: string
}

interface Window {
	DatabufferUi: DataUiStartupConfig
}
