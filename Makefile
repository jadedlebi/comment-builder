.PHONY: help install build deploy test clean setup

help: ## Show this help message
	@echo "CFPB Comment Builder - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	cd client && npm install
	cd server && npm install

build: ## Build the client
	cd client && npm run build

test: ## Run tests
	cd client && npm test
	cd server && npm test

clean: ## Clean build artifacts
	rm -rf client/build/
	rm -rf client/node_modules/
	rm -rf server/node_modules/
	rm -rf node_modules/

setup: install ## Setup development environment
	@echo "Development environment ready!"

deploy: build ## Deploy to Google Cloud Run
	./deploy.sh

deploy-quick: ## Quick deploy without building
	./deploy.sh

logs: ## View Cloud Run logs
	gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=comment-builder" --limit=50

status: ## Check deployment status
	gcloud run services describe comment-builder --region=us-central1 --format="value(status.url)"

url: ## Get service URL
	@echo "Service URL:"
	@gcloud run services describe comment-builder --region=us-central1 --format="value(status.url)"

health: ## Check service health
	@echo "Checking service health..."
	@curl -s $$(gcloud run services describe comment-builder --region=us-central1 --format="value(status.url)")/health || echo "Service not responding"

dev: ## Start development servers
	@echo "Starting development servers..."
	@echo "Client: http://localhost:3000"
	@echo "Server: http://localhost:3001"
	@echo "Press Ctrl+C to stop"
	@cd client && npm start &
	@cd server && npm start &
	@wait
