.PHONY: clean default

FQDN ?= 127.0.0.1

default: SERVER.crt
clean:
	rm -f openssl.conf
	rm -f ROOT.*
	rm -f SERVER.*

openssl.conf:
	cat /etc/ssl/openssl.cnf > openssl.conf
	echo "[ san_env ]" >> openssl.conf
	echo "subjectAltName=IP:$(FQDN)" >> openssl.conf

ROOT.key:
	openssl genrsa 4096 > ROOT.key

ROOT.crt: ROOT.key
	openssl req \
		-new \
		-x509 \
		-nodes \
		-sha256 \
		-key ROOT.key \
		-days 365 \
		-subj "/C=AU/CN=example" \
		-out ROOT.crt

SERVER.csr: openssl.conf
	SAN=IP:$(FQDN) openssl req \
		-reqexts san_env \
		-config openssl.conf \
		-newkey rsa:4096 \
		-nodes -sha256 \
		-keyout SERVER.key \
		-subj "/C=AU/CN=$(FQDN)" \
		-out SERVER.csr

SERVER.crt: clean openssl.conf ROOT.key ROOT.crt SERVER.csr
	SAN=IP:$(FQDN) openssl x509 \
		-req \
		-extfile openssl.conf \
		-extensions san_env \
		-days 365 \
		-in SERVER.csr \
		-CA ROOT.crt \
		-CAkey ROOT.key \
		-CAcreateserial \
		-out SERVER.crt
