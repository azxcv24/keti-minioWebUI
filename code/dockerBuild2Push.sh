#!/bin/bash

# 기본 이미지 이름
DEFAULT_IMAGE_NAME="keti-webplatform/webplatform-backend"

# 기본 버전
DEFAULT_VERSION="1.0.0"

echo -n "도커 빌드 및 harbor 푸쉬"
echo -n "실행전 harbor 로그인 필요!"
echo -n "=========================================="

# 사용자 입력
echo -n "이미지 이름 (기본값: ${DEFAULT_IMAGE_NAME}): "
read IMAGE_NAME

echo -n "버전 (기본값: ${DEFAULT_VERSION}): "
read VERSION

# 이미지 이름 및 버전 설정
IMAGE_NAME=${IMAGE_NAME:-${DEFAULT_IMAGE_NAME}}
VERSION=${VERSION:-${DEFAULT_VERSION}}

# 최종 이미지 이름
FINAL_IMAGE_NAME="harbor.k-sw.org/${IMAGE_NAME}"

# Docker 이미지 빌드
docker build -t ${FINAL_IMAGE_NAME} .

# Docker 이미지 푸시
docker push ${FINAL_IMAGE_NAME}:${VERSION}

# 최신 태그 푸시
docker push ${FINAL_IMAGE_NAME}:latest