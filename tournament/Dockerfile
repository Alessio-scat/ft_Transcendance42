# Dockerfile du service profile

FROM python:3.12-bookworm

RUN mkdir /tournament
WORKDIR /tournament

COPY requirements.txt /tournament/
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY script_python.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/script_python.sh
ENTRYPOINT [ "script_python.sh" ]

EXPOSE 8005
# CMD ["tail", "-f", "/dev/null"]