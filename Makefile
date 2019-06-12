.PHONY: all clean

all: install

install:
	npm install ./server
	#npm install -g ./cli/
	
clean:
