package com.boks.emotionalminutes.controller;

import com.boks.emotionalminutes.service.MeetingService;
import com.boks.emotionalminutes.web.dto.meeting.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class MeetingController {
    private final MeetingService meetingService;

    @PostMapping("/api/meeting")
    public MeetingCodeAndHostIDResponseDto save(@RequestBody MeetingRequestDto requestDto) {
        return meetingService.save(requestDto);
    }

    @PostMapping("/api/meeting/join")
    public MeetingJoinResponseDto join(@RequestBody MeetingJoinRequestDto requestDto) {
        return meetingService.join(requestDto);
    }

    @GetMapping("/api/meeting/{code}")
    public MeetingResponseDto findByCode(@PathVariable String code) {
        return meetingService.findByCode(code);
    }
}
