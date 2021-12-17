
# Crear un certificado TLS para el servidor de prueba
openssl req -newkey rsa:2048 -passout pass:foobar -keyout key.pem -x509 -days 365 -out cert.pem
