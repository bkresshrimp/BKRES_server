# Sử dụng hình ảnh Node.js v14 LTS
FROM node:14

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép file package.json và package-lock.json (nếu có) để tận dụng Docker caching
COPY package*.json ./

# Cài đặt các dependency
RUN npm install

# Sao chép các file còn lại của ứng dụng
COPY . .

# Mở cổng mạng mà ứng dụng sẽ lắng nghe
EXPOSE 5000

# Định nghĩa biến môi trường cho MongoDB
ENV MONGO_DB_CONNECTION_STRING=mongodb+srv://anhduc2002cute:T3FPpHg5mkzKFmOH@cluster0.bdogj3t.mongodb.net/?retryWrites=true&w=majority

# Khởi chạy ứng dụng
CMD ["npm", "start"]
