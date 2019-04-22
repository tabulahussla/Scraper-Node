export default {
	sites: ["test.ru", "test-proxies.ru", "test-accounts.ru"],
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
		"test-proxies.ru": {
			test: {
				manifest: {
					mode: "http",
				},
				async fetch({ site, section, request }) {
					return {
						hello: "world",
					};
				},
			},
		},
		"test-accounts.ru": {
			test: {
				manifest: {
					mode: "http",
				},
				async fetch({ site, section, request }) {
					return {
						hello: "world",
					};
				},
			},
		},
	},
} as IPlugin;
