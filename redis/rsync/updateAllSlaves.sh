#!/bin/bash
rsync -a --exclude 'node_modules' . root@104.130.134.55:/home/redis
rsync -a --exclude 'node_modules' . root@104.130.134.112:/home/redis
rsync -a --exclude 'node_modules' . root@104.130.253.61:/home/redis
rsync -a --exclude 'node_modules' . root@104.130.134.60:/home/redis
rsync -a --exclude 'node_modules' . root@104.130.141.223:/home/redis
rsync -a --exclude 'node_modules' . root@104.239.144.63:/home/redis
rsync -a --exclude 'node_modules' . root@104.239.143.72:/home/redis
