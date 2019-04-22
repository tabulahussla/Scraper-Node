export default {
	sites: ["test.ru"],
	modules: {
		"test.ru": {
			"test-http": {
				manifest: {
					mode: "http",
				},
				async fetch({ site, section, request }) {
					return {
						hello: "world",
					};
				},
			},
			"test-agent": {
				manifest: {
					mode: "agent",
				},
				async fetch({ site, section, request, agent }) {
					return {
						hello: "world",
					};
				},
			},
		},
	},
} as IPlugin;
