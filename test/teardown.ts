import log from "~/common/log";

after(async () => {
	log.info("teardown()");
});
