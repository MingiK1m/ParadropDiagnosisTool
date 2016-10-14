/*
 * This file is part of the Mongoose project, http://code.google.com/p/mongoose
 * It implements an online chat server. For more details,
 * see the documentation on the project web site.
 * To test the application,
 *  1. type "make" in the directory where this file lives
 *  2. point your browser to http://127.0.0.1:8081
 *
 * NOTE(lsm): this file follows Google style, not BSD style as the rest of
 * Mongoose code.
 */

#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <string.h>
#include <time.h>
#include <stdarg.h>
#include <pthread.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/time.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>
#include "mongoose.h"

#define MAX_USER_LEN  20
#define MAX_MESSAGE_LEN  100
#define MAX_MESSAGES 5
#define MAX_SESSIONS 2
#define SESSION_TTL 120

#define PACKET_MAX_SIZE		5130	//5kb + 10

int setupConnection(int port)
{
  int connectionSock;
  socklen_t addr_len;
	struct sockaddr_in sender_addr, reqstr_addr;
	struct hostent *host;
	
	host = (struct hostent *) gethostbyname((char *)"127.0.0.1");

	if((connectionSock = socket(AF_INET, SOCK_STREAM, 0)) == -1)
	{
		printf("ERROR:Socket creation error.\n");
		exit(1);
	}

  bzero((char *) &sender_addr, sizeof(sender_addr));
  sender_addr.sin_family = AF_INET;
  sender_addr.sin_port = htons(port);
  bcopy((char *)host->h_addr, (char *)&sender_addr.sin_addr.s_addr, host->h_length);
    
  if(connect(connectionSock,(struct sockaddr *) &sender_addr,sizeof(sender_addr)) < 0)
	{
		printf("ERROR connecting to socket\n");
		return -1;
	}

  printf ("Connected to %d\n", port);

  sendto(connectionSock, "hi", 2, 0, (struct sockaddr *)&sender_addr, sizeof(struct sockaddr));
  return connectionSock;
}

int receiveData(int connectionSock, char *data)
{
  int bytes_read;
  socklen_t addr_len;
	struct sockaddr_in sender_addr, reqstr_addr;
	struct hostent *host;
	
  addr_len = sizeof(struct sockaddr);

  bzero(data,PACKET_MAX_SIZE);
  bytes_read = recvfrom(connectionSock,data,PACKET_MAX_SIZE-1,0,(struct sockaddr *)&sender_addr, &addr_len);

  if(bytes_read < 0)
  {
    data[0] = '\0';
    return 0;
  }

  data[bytes_read] = '\0';
  return bytes_read;
}

static void stream_data(struct mg_connection *conn,
                      const struct mg_request_info *request_info) {
  int rv = mg_printf(conn, "HTTP/1.1 200 OK\r\n"
			   "Cache: no-cache\r\n"
			   "Content-Type: text/event-stream\r\n"
			   "\r\n");

  char timeStr[255];
  long timeDiff;
  char data[PACKET_MAX_SIZE];
  char tmp[PACKET_MAX_SIZE];
  char *pch;
  int timeIndex = 0;
  int length = 0;
  int found = 0;
  int i = 0;

  int connectionSock = setupConnection(5000);
  if(connectionSock < 0)
    return;


  length = receiveData(connectionSock, data);
  /*struct timeval prevTime, curTime;
  gettimeofday(&curTime, NULL);
  prevTime = curTime;*/

  //while(1){
  while(length){
    /*timeDiff = (curTime.tv_usec - prevTime.tv_usec);
    timeDiff += ((curTime.tv_sec - prevTime.tv_sec)*1000000);
    sprintf(timeStr, "%ld", timeDiff);
    
    found = 0;

    i = 0;
    for(i = strlen(data) - 1 - strlen("\"timestamp\":"); i >= 0; i--)
    {
      if(!strncmp(data+i, "\"timestamp\":", strlen("\"timestamp\":")))
      {
        found = 1;
        timeIndex = i;
        break;
      }
    }

    if(found)
    {
      pch = strchr(data + timeIndex,':');
      pch++;
      i = 0;
      while(tmp[i++] = *(pch++));
      pch = strchr(data + timeIndex,':');
      pch++;
      strcpy(pch, timeStr);
      i = 0;
      while(tmp[i])
      {
        //skip digits and whitespaces
        if(!((tmp[i] >= '0' && tmp[i] <= '9') || tmp[i] == ' '))
          break;
        
        i++;
      }
      strcat(data, tmp+i);
    }*/

    printf("---->%s\n<----", data);

    /*char msg[] = 
      "event: channel\r\n\
      freq : 2437\r\n\
data: { \"ch\": [79,0,0,0,0,0,0,0,0,123,111,100,98,100,88,93,101,93,96,94,92,87,75,78,87,97,123,98,98,98,99,96,99,93,103,97,95,97,101,98,98,104,113,117,98,97,99,99,92,98,100,101,93,97,106,98,107,97,107,99,99,102,104,109,97], \"timestamp\": 7 }\r\n\n\n";*/

/*event : channel
freq : 2437
data: { "ch": [87.3182,87.8636,87.5,86.6818,88.1364,85.4091,86.0455,85.4091,84.5,83.2273,77.7273,74.4091,81.5909,81.9545,85,84.7273,85.8636,86.2727,88.5909,87.5,87.0909,87.1818,88.2273,89.8182,89.0909,88.0909,89.7727,90.6818,90.1818,89.9545,89.3636,88.9091,87.8636,87.8636,86.4545,84.9091,81.9545,79.2727,84.2273,84.5909,86.0909,87.8636,84.9545,88.7273,87.6818,85.3182,88,88.5909,87.0909,86.9545,88.0909,88.9091,89.0455,90.4091,90.5909,91.0909],"timestamp":534596987}*/

   /*char msg[] = "event : channel\r\nfreq: 2437\r\ndata : { \"ch\": [104.55,103.67,101.23,101.55,102,101,102,100,96,95,95,91,94,91,91,94,92,91,93,90,90,90,87,88,92,90,92,94,94,94,95,90,94,93,89,91,90,79,93,94,92,93,93,91,94,94,93,98,96,96,100,99,100,99,100,103], \"timestamp\": 56808080 }\r\n\n\n";*/
    

    mg_printf(conn, data);
    //mg_printf(conn, msg);
    
    // Kill some time, and repeat
    //usleep(500000); // About 2fps
    length = receiveData(connectionSock, data);
    /*prevTime = curTime;
    gettimeofday(&curTime, NULL);*/
  }
  
  //close(connectionSock);
}

static void *event_handler(enum mg_event event,
                           struct mg_connection *conn,
                           const struct mg_request_info *request_info) {
  void *processed = "yes";

  if (event == MG_NEW_REQUEST) {
    if (!strcmp(request_info->uri, "/livedata")) {
      printf("livedata request received\n");
      // Set up a data stream
      stream_data(conn, request_info);
    } else {
      // No suitable handler found, mark as not processed. Mongoose will
      // try to serve the request.
      printf("Received request\n");
      processed = NULL;
    }
  } else {
    processed = NULL;
  }

  return processed;
}

static const char *options[] = {
  "document_root", "html",
  "listening_ports", "8100",
//  "ssl_certificate", "ssl_cert.pem",
  "num_threads", "500",
  NULL
};

int main(void) {
  struct mg_context *ctx;

  // Initialize random number generator. It will be used later on for
  // the session identifier creation.
  srand((unsigned) time(0));

  // Setup and start Mongoose
  ctx = mg_start(&event_handler, NULL, options);
  if (ctx == NULL)
  	return EXIT_SUCCESS;

  // Wait until enter is pressed, then exit
  printf("Chat server started on ports %s, press enter to quit.\n",
         mg_get_option(ctx, "listening_ports"));
  getchar();
  mg_stop(ctx);
  printf("%s\n", "Chat server stopped.");

  return EXIT_SUCCESS;
}

// vim:ts=2:sw=2:et
