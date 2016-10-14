CFLAGS=	-I.. -pthread -g

all:
	OS=`uname`; \
	  test "$$OS" = Linux && LIBS="-ldl" ; \
	  $(CC) $(CFLAGS) chat.c mongoose.c  $$LIBS $(ADD)
	#./$(PROG)
