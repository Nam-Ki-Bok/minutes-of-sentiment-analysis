package com.boks.emotionalminutes.service;

import com.boks.emotionalminutes.domain.minutes.Minutes;
import com.boks.emotionalminutes.domain.minutes.MinutesRepository;
import com.boks.emotionalminutes.domain.sentence.Sentence;
import com.boks.emotionalminutes.domain.totalEmotions.TotalEmotions;
import com.boks.emotionalminutes.domain.totalEmotions.TotalEmotionsRepository;
import com.boks.emotionalminutes.web.dto.totalEmotions.TotalEmotionsRequestDto;
import com.boks.emotionalminutes.web.dto.totalEmotions.TotalEmotionsResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional(readOnly = true)
@RequiredArgsConstructor
@Service
public class TotalEmotionsService {
    private final TotalEmotionsRepository totalEmotionsRepository;
    private final MinutesRepository minutesRepository;

    @Transactional
    public Long save(Long id) {
        Minutes minutes = minutesRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 회의록이 없습니다. id=" + id));

        List<Sentence> sentences = minutes.getSentences();
        System.out.println("회의록(id = " + id + ") 의 문장 리스트를 가져왔습니다.");
        for (Sentence value : sentences) {
            System.out.println(value.getContent());
        }
        float total = sentences.size();
        float happy = 0;
        float emotionless = 0;
        float angry = 0;
        float sad = 0;

        for(Sentence value : sentences) {
            String emotion = value.getEmotion();
            if ("기쁨".equals(emotion)) {
                happy += 1;
            } else if ("중립".equals(emotion)) {
                emotionless += 1;
            } else if ("화남".equals(emotion)) {
                angry += 1;
            } else if ("슬픔".equals(emotion)) {
                sad += 1;
            }
        }

        TotalEmotions entity = TotalEmotions.builder()
                .happy(happy / total * 100)
                .emotionless(emotionless / total * 100)
                .angry(angry / total * 100)
                .sad(sad / total * 100)
                .build();
        return totalEmotionsRepository.save(entity).getId();
    }

    public TotalEmotionsResponseDto findByMinutesId(Long id) {
        Minutes minutes = minutesRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 회의록이 없습니다. id=" + id));
        return new TotalEmotionsResponseDto(minutes.getTotalEmotions());
    }
}