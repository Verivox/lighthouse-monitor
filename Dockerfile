FROM node:12-slim

WORKDIR /app
COPY . .

RUN apt-get update \
    && apt-get install -y fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 libxtst6 \
    && apt-get install -y adwaita-icon-theme dconf-gsettings-backend dconf-service glib-networking glib-networking-common \
    && apt-get install -y glib-networking-services gsettings-desktop-schemas gtk-update-icon-cache hicolor-icon-theme libasound2 \
    && apt-get install -y libasound2-data libatk-bridge2.0-0 libatk1.0-0 libatk1.0-data libatspi2.0-0 libavahi-client3 libavahi-common-data \
    && apt-get install -y libavahi-common3 libcairo-gobject2 libcairo2 libcolord2 libcroco3 libcups2 libcurl3-gnutls libdatrie1 libdbus-1-3 \
    && apt-get install -y libdconf1 libdrm2 libegl1-mesa libepoxy0 libgbm1 libgdk-pixbuf2.0-0 libgdk-pixbuf2.0-common libglib2.0-0 \
    && apt-get install -y libgraphite2-3 libgssapi-krb5-2 libgtk-3-0 libgtk-3-common libharfbuzz0b libicu57 libjbig0 libjpeg62-turbo \
    && apt-get install -y libjson-glib-1.0-0 libjson-glib-1.0-common libk5crypto3 libkeyutils1 libkrb5-3 libkrb5support0 liblcms2-2 \
    && apt-get install -y libnghttp2-14 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libpangoft2-1.0-0 libpixman-1-0 libproxy1v5 \
    && apt-get install -y librest-0.7-0 librsvg2-2 librsvg2-common librtmp1 libsoup-gnome2.4-1 libsoup2.4-1 libssh2-1 libthai-data libthai0 \
    && apt-get install -y libtiff5 libwayland-client0 libwayland-cursor0 libwayland-egl1-mesa libwayland-server0 libx11-xcb1 libxcb-dri2-0 \
    && apt-get install -y libxcb-dri3-0 libxcb-present0 libxcb-render0 libxcb-shm0 libxcb-sync1 libxcb-xfixes0 libxcomposite1 libxcursor1 \
    && apt-get install -y libxdamage1 libxfixes3 libxinerama1 libxkbcommon0 libxml2 libxrandr2 libxrender1 libxshmfence1 shared-mime-info \
    && apt-get install -y xdg-utils xkb-data \
    && apt-get clean \
    && npm install