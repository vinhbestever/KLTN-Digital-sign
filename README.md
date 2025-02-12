# KLTN

## Installation


Source supports following OS.
- Ubuntu.
- MacOS
- Windown

Source require:
- python >= 3.9
- node >= 18.0.0

### Install source code

#### Clone code
```bash
git https://github.com/vinhbestever/KLTN-Digital-sign.git
```

#### Install PostgreSQL

- Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

- MacOS
```bash
brew install postgresql@14
```

- Khởi động PostgreSQL
```bash
sudo systemctl enable postgresql  # Bật PostgreSQL khi khởi động
sudo systemctl start postgresql   # Khởi động PostgreSQL
```

- Init database
```bash
psql -U digital_user -d digital_signature -f database.sql
```

#### Cài đặt dependencies
```bash
cd backend
npm install
cd ../frontend
npm install
```

#### Chạy hệ thống
```bash
cd backend
npm start
cd ../frontend
npm run dev
```
- or
```bash
docker-compose up -d --build
```

#### Truy cập hệ thống tại
```bash
http://localhost:5173
```