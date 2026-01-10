package com.trading.engine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;

@SpringBootApplication
public class EngineApplication {

	public static void main(String[] args) {
		// FORCE UTC TIMEZONE (Fixes the Postgres Connection Error)
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		
		SpringApplication.run(EngineApplication.class, args);
	}

}